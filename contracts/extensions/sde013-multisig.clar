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

(define-constant ERR_UNAUTHORIZED (err u3600))
(define-constant ERR_NOT_SIGNER (err u3601))
(define-constant ERR_INVALID (err u3602))
(define-constant ERR_ALREADY_EXECUTED (err u3603))
(define-constant ERR_PROPOSAL_ALREADY_EXISTS (err u3604))
(define-constant ERR_PROPOSAL_ALREADY_EXECUTED (err u3605))

(define-data-var signers (list 10 principal) (list))
(define-data-var signalsRequired uint u2)
(define-data-var lastRemovedSigner (optional principal) none)

(define-map Proposals
  principal
  {
    proposer: principal,
    concluded: bool
  }
)
(define-map Signals {proposal: principal, teamMember: principal} bool)
(define-map SignalCount principal uint)

;; --- Authorization check

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

(define-public (add-signer (who principal))
  (begin
    (try! (is-dao-or-extension))
    (var-set signers (unwrap-panic (as-max-len? (append (var-get signers) who) u10)))
    (ok true)
  )
)

(define-public (remove-signer (who principal))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (>= (- (len (var-get signers)) u1) (var-get signalsRequired)) ERR_INVALID)
    (asserts! (not (is-none (index-of (var-get signers) who))) ERR_INVALID)
    (var-set lastRemovedSigner (some who))
    (var-set signers (unwrap-panic (as-max-len? (filter remove-signer-filter (var-get signers)) u10)))
    (ok true)
  )
)

(define-public (set-signals-required (newRequirement uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (<= (var-get signalsRequired) (len (var-get signers))) ERR_INVALID)
    (ok (var-set signalsRequired newRequirement))
  )
)

;; --- Read only functions

(define-read-only (is-signer (who principal))
  (is-some (index-of (var-get signers) tx-sender))
)


(define-read-only (has-signaled (proposal principal) (who principal))
  (default-to false (map-get? Signals {proposal: proposal, teamMember: who}))
)

(define-read-only (get-proposal-data (proposal principal))
  (map-get? Proposals proposal)
)

(define-read-only (get-signals-required)
  (var-get signalsRequired)
)

(define-read-only (get-signers)
  (var-get signers)
)

(define-read-only (get-signers-count)
  (len (var-get signers))
)

(define-read-only (get-proposal-signals (proposal principal))
  (default-to u0 (map-get? SignalCount proposal))
)

;; --- Public functions

(define-public (add-proposal (proposal <proposal-trait>))
  (let
    (
      (proposalPrincipal (contract-of proposal))
    )
    (asserts! (is-signer tx-sender) ERR_NOT_SIGNER)
    (asserts! (map-insert Proposals proposalPrincipal {proposer: tx-sender, concluded: false}) ERR_PROPOSAL_ALREADY_EXISTS)
    (asserts! (is-none (contract-call? .executor-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    (print {event: "propose", proposal: proposal, proposer: tx-sender})
    (map-set Signals {proposal: proposalPrincipal, teamMember: tx-sender} true)
    (map-set SignalCount proposalPrincipal u1) ;; increment the signal count for proposer
    (ok true)
  )
)

(define-public (sign (proposal <proposal-trait>))
  (let
    (
      (proposalPrincipal (contract-of proposal))
      (signals 
        (+ 
          (get-proposal-signals proposalPrincipal) 
          (if (has-signaled proposalPrincipal tx-sender) u0 u1)
        )
      )
      (proposalData (unwrap-panic (get-proposal-data proposalPrincipal)))
    )
    (asserts! (is-signer tx-sender) ERR_NOT_SIGNER)
    (asserts! (is-none (contract-call? .executor-dao executed-at proposal)) ERR_ALREADY_EXECUTED)
    (and (>= signals (var-get signalsRequired))
      (begin
        (try! (contract-call? .executor-dao execute proposal tx-sender))
        (map-set Proposals proposalPrincipal
          (merge proposalData {concluded: true})
        )
      )
    )
    (map-set Signals {proposal: proposalPrincipal, teamMember: tx-sender} true)
    (map-set SignalCount proposalPrincipal signals)
    (ok signals)
  )
)

;; Private functions

(define-private (remove-signer-filter (signer principal))
  (not (is-eq signer (unwrap-panic (var-get lastRemovedSigner))))
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)
