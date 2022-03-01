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

;; Title: SDE013 Multisig
;; Author: StackerDAO Dev Team
;; Depends-On:
;; Synopsis:
;; Description:

(use-trait proposal-trait .proposal-trait.proposal-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u2700))
(define-constant ERR_NOT_SIGNER (err u2701))
(define-constant ERR_ALREADY_EXECUTED (err u2703))
(define-constant ERR_PROPOSAL_ALREADY_EXISTS (err u2704))
(define-constant ERR_PROPOSAL_ALREADY_EXECUTED (err u2705))

(define-data-var signalsRequired uint u2) ;; signals required for an execution.

(define-map Signers principal bool)
(define-map Proposals
  principal
  {
    proposer: principal,
    confirmed: bool
  }
)
(define-map Signals {proposal: principal, teamMember: principal} bool)
(define-map SignalCount principal uint)

;; --- Authorization check

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

(define-public (set-signer (who principal) (member bool))
  (begin
    (try! (is-dao-or-extension))
    (ok (map-set Signers who member))
  )
)

(define-public (set-signals-required (newRequirement uint))
  (begin
    (try! (is-dao-or-extension))
    (ok (var-set signalsRequired newRequirement))
  )
)

;; --- Read only functions

(define-read-only (is-signer (who principal))
  (default-to false (map-get? Signers who))
)

(define-read-only (get-proposal-data (proposal principal))
  (map-get? Proposals proposal)
)

(define-read-only (has-signaled (proposal principal) (who principal))
  (default-to false (map-get? Signals {proposal: proposal, teamMember: who}))
)

(define-read-only (get-signals-required)
  (var-get signalsRequired)
)

(define-read-only (get-signals (proposal principal))
  (default-to u0 (map-get? SignalCount proposal))
)

;; --- Public functions

(define-public (add-proposal (proposal <proposal-trait>))
  (begin
    (let
      (
        (proposalPrincipal (contract-of proposal))
        (signals (+ (get-signals proposalPrincipal) (if (has-signaled proposalPrincipal tx-sender) u0 u1)))
      )
      (asserts! (is-signer tx-sender) ERR_NOT_SIGNER)
      (asserts! (map-insert Proposals (contract-of proposal) {proposer: tx-sender, confirmed: false}) ERR_PROPOSAL_ALREADY_EXISTS)
      (asserts! (is-none (contract-call? .executor-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
      (print {event: "propose", proposal: proposal, proposer: tx-sender})
      (map-set Signals {proposal: (contract-of proposal), teamMember: tx-sender} true)
      (map-set SignalCount proposalPrincipal signals)
      (ok signals)
    )
  )
)

(define-public (sign (proposal <proposal-trait>))
  (let
    (
      (proposalPrincipal (contract-of proposal))
      (signals (+ (get-signals proposalPrincipal) (if (has-signaled proposalPrincipal tx-sender) u0 u1)))
    )
    (asserts! (is-signer tx-sender) ERR_NOT_SIGNER)
    (asserts! (is-none (contract-call? .executor-dao executed-at proposal)) ERR_ALREADY_EXECUTED)
    (and (>= signals (var-get signalsRequired))
      (let
        (
          (proposalData (unwrap-panic (get-proposal-data proposalPrincipal)))
        )
        (merge proposalData {confirmed: true})
        (try! (contract-call? .executor-dao execute proposal tx-sender))
      )
    )
    (map-set Signals {proposal: proposalPrincipal, teamMember: tx-sender} true)
    (map-set SignalCount proposalPrincipal signals)
    (ok signals)
  )
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)
