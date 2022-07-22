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

(impl-trait .extension-trait.extension-trait)
(impl-trait .sip010-ft-trait.sip010-ft-trait)

(define-constant ERR_UNAUTHORIZED (err u2300))
(define-constant ERR_FAILED_TO_LOCK (err u2301))
(define-constant ERR_FAILED_TO_UNLOCK (err u2302))
(define-constant ERR_AMOUNT_MISMATCH (err u2304))

(define-constant CONTRACT_ADDRESS (as-contract tx-sender))

(define-fungible-token Locked-Mega)

(define-data-var tokenName (string-ascii 32) "Locked Mega")
(define-data-var tokenSymbol (string-ascii 10) "LMEGA")
(define-data-var tokenUri (optional (string-utf8 256)) none)
(define-data-var tokenDecimals uint u2)

(define-map LockedTokens { voter: principal, proposal: principal } uint)

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

(define-public (lock (amount uint) (proposal principal) (owner principal))
	(begin
		(try! (is-dao-or-extension))
		(unwrap! (contract-call? .sde-stackerdao-token transfer amount owner CONTRACT_ADDRESS none) ERR_FAILED_TO_LOCK)
    (map-set LockedTokens { voter: owner, proposal: proposal }
      (+ (get-current-total-locked proposal owner) amount)
    )
    (print {event: "lock", amount: amount, voter: owner, proposal: proposal})
    (ft-mint? Locked-Mega amount owner)
	)
)

(define-public (unlock (amount uint) (proposal principal) (owner principal))
  (let
      (
        (unlockAmount (get-current-total-locked proposal owner))
      )

      (try! (is-dao-or-extension))
      (asserts! (is-eq unlockAmount amount) ERR_AMOUNT_MISMATCH)
      (unwrap! (as-contract (contract-call? .sde-stackerdao-token transfer (get-current-total-locked proposal owner) CONTRACT_ADDRESS owner (some 0x11))) ERR_FAILED_TO_UNLOCK)
      (print {event: "unlock", amount: unlockAmount, voter: owner, proposal: proposal})
      (ft-burn? Locked-Mega unlockAmount owner)
  )
)

(define-read-only (get-locked-token-data (voter principal ) (proposal principal))
	(map-get? LockedTokens { voter: voter, proposal: proposal })
)

(define-read-only (get-current-total-locked (proposal principal) (voter principal))
	(default-to u0 (map-get? LockedTokens { voter: voter, proposal: proposal }))
)

;; --- SIP010 traits

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
	(ok true)
)

(define-read-only (get-name)
	(ok (var-get tokenName))
)

(define-read-only (get-symbol)
	(ok (var-get tokenSymbol))
)

(define-read-only (get-decimals)
	(ok (var-get tokenDecimals))
)

(define-read-only (get-balance (who principal))
	(ok (ft-get-balance Locked-Mega who))
)

(define-read-only (get-total-supply)
	(ok (ft-get-supply Locked-Mega))
)

(define-read-only (get-token-uri)
	(ok (var-get tokenUri))
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
