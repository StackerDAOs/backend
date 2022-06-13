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

;; Title: SDE005 Dev Fund
;; Author: Marvin Janssen / StackerDAO Dev Team

(impl-trait .extension-trait.extension-trait)

(define-constant ONE_MONTH_TIME u4380) ;; 43,800 minutes / 10 minute average block time.

(define-constant ERR_UNAUTHORIZED (err u3000))
(define-constant ERR_NO_ALLOWANCE (err u3001))
(define-constant ERR_ALREADY_CLAIMED (err u3002))

(define-data-var allowanceStartHeight uint u0)

(define-map MonthlyDeveloperAllowances principal uint)
(define-map ClaimCounts principal uint)

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

(define-public (set-issuance-start-height (startHeight uint))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set allowanceStartHeight startHeight))
	)
)

(define-public (set-investor-issuance (amount uint) (who principal))
	(begin
		(try! (is-dao-or-extension))
		(ok (map-set MonthlyDeveloperAllowances who amount))
	)
)

(define-private (set-investor-issuances-iter (item {amount: uint, who: principal}) (previous bool))
	(map-set MonthlyDeveloperAllowances (get who item) (get amount item))
)

(define-public (set-investor-issuances (investors (list 200 {amount: uint, who: principal})))
	(begin
		(try! (is-dao-or-extension))
		(ok (fold set-investor-issuances-iter investors true))
	)
)

(define-public (transfer (amount uint) (recipient principal) (memo (optional (buff 34))))
	(begin
		(try! (is-dao-or-extension))
		(as-contract (contract-call? .sde-governance-token-with-lockup transfer amount tx-sender recipient memo))
	)
)

;; --- Public functions

(define-read-only (get-developer-allowance (who principal))
	(default-to u0 (map-get? MonthlyDeveloperAllowances who))
)

(define-read-only (get-developer-claim-count (who principal))
	(default-to u0 (map-get? ClaimCounts who))
)

(define-public (claim (memo (optional (buff 34))))
	(let
		(
			(allowance (get-developer-allowance tx-sender))
			(claimCount (get-developer-claim-count tx-sender))
			(startHeight (var-get allowanceStartHeight))
			(maxClaims (/ (- block-height startHeight) ONE_MONTH_TIME))
			(developer tx-sender)
		)
		(asserts! (> startHeight u0) ERR_UNAUTHORIZED)
		(asserts! (> allowance u0) ERR_NO_ALLOWANCE)
		(asserts! (< claimCount maxClaims) ERR_ALREADY_CLAIMED)
		(map-set ClaimCounts tx-sender maxClaims)
		(as-contract (contract-call? .sde-governance-token-with-lockup transfer (* (- maxClaims claimCount) allowance) tx-sender developer memo))
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
