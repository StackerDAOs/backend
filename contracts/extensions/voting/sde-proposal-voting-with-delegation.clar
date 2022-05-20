;;     _____________  _______ _________  ___  ___  ____  ____
;;     / __/_  __/ _ |/ ___/ //_/ __/ _ \/ _ \/ _ |/ __ \/ __/
;;     _\ \  / / / __ / /__/ ,< / _// , _/ // / __ / /_/ /\ \  
;;    /___/ /_/ /_/ |_\___/_/|_/___/_/|_/____/_/ |_\____/___/  
;;                                                          
;;     _____  _____________  ______________  _  __           
;;    / __/ |/_/_  __/ __/ |/ / __/  _/ __ \/ |/ /           
;;   / _/_>  <  / / / _//    /\ \_/ // /_/ /    /            
;;  /___/_/|_| /_/ /___/_/|_/___/___/\____/_/|_/             
;;                                                           

;; Title: Proposal Voting with Delegation
;; Author: StackerDAO

(use-trait proposal-trait .proposal-trait.proposal-trait)
(use-trait delegate-token-trait .delegate-token-trait.delegate-token-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u2500))
(define-constant ERR_NOT_GOVERNANCE_TOKEN (err u2501))
(define-constant ERR_PROPOSAL_ALREADY_EXECUTED (err u2502))
(define-constant ERR_PROPOSAL_ALREADY_EXISTS (err u2503))
(define-constant ERR_UNKNOWN_PROPOSAL (err u2504))
(define-constant ERR_PROPOSAL_ALREADY_STARTED (err u2505))
(define-constant ERR_PROPOSAL_ALREADY_CONCLUDED (err u2506))
(define-constant ERR_PROPOSAL_INACTIVE (err u2507))
(define-constant ERR_PROPOSAL_NOT_CONCLUDED (err u2508))
(define-constant ERR_NO_VOTES_TO_RETURN (err u2509))
(define-constant ERR_QUORUM_NOT_MET (err u2510))
(define-constant ERR_END_BLOCK_HEIGHT_NOT_REACHED (err u2511))
(define-constant ERR_DISABLED (err u2512))
(define-constant ERR_INSUFFICIENT_BALANCE (err u2513))
(define-constant ERR_UNKNOWN_PARAMETER (err u2514))

(define-data-var governanceTokenPrincipal principal .sde-governance-token-with-lockup)

(define-map Proposals
	principal
	{
		votesFor: uint,
		votesAgainst: uint,
		startBlockHeight: uint,
		endBlockHeight: uint,
		concluded: bool,
		passed: bool,
		proposer: principal
	}
)
(define-map MemberTotalVotes {proposal: principal, voter: principal, governanceToken: principal} uint)
(define-map parameters (string-ascii 34) uint)

(map-set parameters "voteFactor" u400000) ;; 1% of 250k initially distributed to Megapoont holders required to vote
(map-set parameters "quorumThreshold" u12500) ;; 5% of 250k initially distributed to Megapoont holders required for quorum

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

(define-public (set-governance-token (governanceToken <delegate-token-trait>))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set governanceTokenPrincipal (contract-of governanceToken)))
	)
)

(define-public (set-parameter (parameter (string-ascii 34)) (value uint))
	(begin
		(try! (is-dao-or-extension))
		(try! (get-parameter parameter))
		(ok (map-set parameters parameter value))
	)
)

(define-public (add-proposal (proposal <proposal-trait>) (data {startBlockHeight: uint, endBlockHeight: uint, proposer: principal}))
	(begin
		(try! (is-dao-or-extension))
		(asserts! (is-none (contract-call? .executor-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
		(print {event: "propose", proposal: proposal, proposer: tx-sender})
		(ok (asserts! (map-insert Proposals (contract-of proposal) (merge {votesFor: u0, votesAgainst: u0, concluded: false, passed: false} data)) ERR_PROPOSAL_ALREADY_EXISTS))
	)
)

(define-public (cancel-proposal (proposal <proposal-trait>))
	(begin
		(try! (is-dao-or-extension))
		(asserts! (is-none (contract-call? .executor-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
		(asserts! (< block-height (get startBlockHeight (unwrap-panic (get-proposal-data (contract-of proposal))))) ERR_PROPOSAL_ALREADY_STARTED)
		(print {event: "cancel", proposal: proposal, proposer: tx-sender})
		(ok (asserts! (map-delete Proposals (contract-of proposal)) ERR_UNKNOWN_PROPOSAL))
	)
)

;; --- Public functions

(define-read-only (get-governance-token)
	(var-get governanceTokenPrincipal)
)

(define-private (is-governance-token (governanceToken <delegate-token-trait>))
	(ok (asserts! (is-eq (contract-of governanceToken) (var-get governanceTokenPrincipal)) ERR_NOT_GOVERNANCE_TOKEN))
)

(define-read-only (get-parameter (parameter (string-ascii 34)))
	(ok (unwrap! (map-get? parameters parameter) ERR_UNKNOWN_PARAMETER))
)

(define-read-only (get-proposal-data (proposal principal))
	(map-get? Proposals proposal)
)

(define-read-only (get-current-total-votes (proposal principal) (voter principal) (governanceToken principal))
	(default-to u0 (map-get? MemberTotalVotes {proposal: proposal, voter: voter, governanceToken: governanceToken}))
)

(define-public (vote (amount uint) (for bool) (proposal principal) (governanceToken <delegate-token-trait>))
	(let
		(
			(proposalData (unwrap! (map-get? Proposals proposal) ERR_UNKNOWN_PROPOSAL))
			(tokenPrincipal (contract-of governanceToken))
		)
		(try! (is-governance-token governanceToken))
		(asserts! (>= block-height (get startBlockHeight proposalData)) ERR_PROPOSAL_INACTIVE)
		(asserts! (< block-height (get endBlockHeight proposalData)) ERR_PROPOSAL_INACTIVE)
		(asserts! (try! (contract-call? governanceToken has-percentage-balance tx-sender (try! (get-parameter "voteFactor")))) ERR_INSUFFICIENT_BALANCE)
		(map-set MemberTotalVotes {proposal: proposal, voter: tx-sender, governanceToken: tokenPrincipal}
			(+ (get-current-total-votes proposal tx-sender tokenPrincipal) amount)
		)
		(map-set Proposals proposal
			(if for
				(merge proposalData {votesFor: (+ (get votesFor proposalData) amount)})
				(merge proposalData {votesAgainst: (+ (get votesAgainst proposalData) amount)})
			)
		)
		(print {event: "vote", proposal: proposal, voter: tx-sender, for: for, amount: amount})
		(ok true)
	)
)

(define-public (conclude (proposal <proposal-trait>))
	(let
		(
			(proposalData (unwrap! (map-get? Proposals (contract-of proposal)) ERR_UNKNOWN_PROPOSAL))
			(totalVotes (+ (get votesFor proposalData) (get votesAgainst proposalData)))
			(passed (and (>= totalVotes (try! (get-parameter "quorumThreshold"))) (> (get votesFor proposalData) (get votesAgainst proposalData))))
		)
		(asserts! (not (get concluded proposalData)) ERR_PROPOSAL_ALREADY_CONCLUDED)
		(asserts! (>= block-height (get endBlockHeight proposalData)) ERR_END_BLOCK_HEIGHT_NOT_REACHED)
		(map-set Proposals (contract-of proposal) (merge proposalData {concluded: true, passed: passed}))
		(print {event: "conclude", proposal: proposal, totalVotes: totalVotes, quorum: (try! (get-parameter "quorumThreshold")), passed: passed})
		(and passed (try! (contract-call? .executor-dao execute proposal tx-sender)))
		(ok passed)
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
