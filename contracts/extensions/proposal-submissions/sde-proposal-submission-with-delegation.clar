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

;; Title: Proposal Submission with Delegation
;; Author: StackerDAO
;; Description:

(use-trait proposal-trait .proposal-trait.proposal-trait)
(use-trait delegate-token-trait .delegate-token-trait.delegate-token-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u2600))
(define-constant ERR_NOT_GOVERNANCE_TOKEN (err u2601))
(define-constant ERR_INSUFFICIENT_WEIGHT (err u2602))
(define-constant ERR_UNKNOWN_PARAMETER (err u2603))
(define-constant ERR_PROPOSAL_MINIMUM_START_DELAY (err u2604))
(define-constant ERR_PROPOSAL_MAXIMUM_START_DELAY (err u2605))

(define-data-var governanceTokenPrincipal principal .sde-governance-token-with-delegation)

(define-map parameters (string-ascii 34) uint)

(map-set parameters "proposeFactor" u400000) ;; 1% of 250k initially distributed to Megapoont holders required to vote
(map-set parameters "proposalDuration" u1440) ;; ~10 days based on a ~10 minute block time.
(map-set parameters "minimumProposalStartDelay" u144) ;; ~1 day minimum delay before voting on a proposal can start.
(map-set parameters "maximumProposalStartDelay" u1008) ;; ~7 days maximum delay before voting on a proposal can start.

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

(define-private (set-parameters-iter (item {parameter: (string-ascii 34), value: uint}) (previous (response bool uint)))
	(begin
		(try! previous)
		(try! (get-parameter (get parameter item)))
		(ok (map-set parameters (get parameter item) (get value item)))
	)
)

(define-public (set-parameters (parameter-list (list 200 {parameter: (string-ascii 34), value: uint})))
	(begin
		(try! (is-dao-or-extension))
		(fold set-parameters-iter parameter-list (ok true))
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

(define-public (propose (proposal <proposal-trait>) (startBlockHeight uint) (governanceToken <delegate-token-trait>))
	(begin
		(try! (is-governance-token governanceToken))
		(asserts! (>= startBlockHeight (+ block-height (try! (get-parameter "minimumProposalStartDelay")))) ERR_PROPOSAL_MINIMUM_START_DELAY)
		(asserts! (<= startBlockHeight (+ block-height (try! (get-parameter "maximumProposalStartDelay")))) ERR_PROPOSAL_MAXIMUM_START_DELAY)
		(asserts! (try! (contract-call? governanceToken has-percentage-balance tx-sender (try! (get-parameter "proposeFactor")))) ERR_INSUFFICIENT_WEIGHT)
		(contract-call? .sde-proposal-voting-with-delegation add-proposal
			proposal
			{
				startBlockHeight: startBlockHeight,
				endBlockHeight: (+ startBlockHeight (try! (get-parameter "proposalDuration"))),
				proposer: tx-sender
			}
		)
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
