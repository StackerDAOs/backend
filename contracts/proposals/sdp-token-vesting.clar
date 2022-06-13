;;     _____________  _______ _________  ___  ___  ____  ____
;;     / __/_  __/ _ |/ ___/ //_/ __/ _ \/ _ \/ _ |/ __ \/ __/
;;     _\ \  / / / __ / /__/ ,< / _// , _/ // / __ / /_/ /\ \  
;;    /___/ /_/ /_/ |_\___/_/|_/___/_/|_/____/_/ |_\____/___/  
;;                                                          
;;     ___  ___  ____  ___  ____  _______   __               
;;    / _ \/ _ \/ __ \/ _ \/ __ \/ __/ _ | / /               
;;   / ___/ , _/ /_/ / ___/ /_/ /\ \/ __ |/ /__              
;;  /_/  /_/|_|\____/_/   \____/___/_/ |_/____/              
;;                                                         

;; Title: SDP Dev fund
;; Author: StackerDAO Dev Team
;; Type: External
;; Description:
;; If this proposal passes, it mints new governance tokens equal to 30% of the total
;; supply and awards them to the SDE005 Dev Fund extension. It contains a number of
;; principals and set allowances. Any principal with an allowance is able to claim
;; an amount of tokens equal to the allowance on a (roughly) monthly basis.
;; Principals can be added and removed, and allowances can be changed via future
;; proposals.

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(let
		(
			(decimals (unwrap-panic (contract-call? .sde-governance-token get-decimals)))
			(totalSupply (* (pow u10 decimals) u100000000)) ;; 100m tokens
			(issuedAmount (/ (* totalSupply u30) u100)) ;; 30% of total supply
			(microTokens (pow u10 decimals))
		)
		(try! (contract-call? .executor-dao set-extension .sde-token-vesting true))
		(try! (contract-call? .sde-token-vesting set-issuance-start-height block-height))
		(try! (contract-call? .sde-token-vesting set-investor-issuances (list
			{who: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG, amount: (* microTokens u100)}
			{who: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC, amount: (* microTokens u20)}
		)))

		(print {event: "execute", sender: sender})
		(contract-call? .sde-governance-token mint issuedAmount .sde-token-vesting)
	)
)
