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

;; Title: SDP Delegate Voting DAO
;; Author: StackerDAO Dev Team
;; Type: Bootstrap

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(let
			(
				(decimals (unwrap-panic (contract-call? .sde-governance-token get-decimals)))
				(microTokens (pow u10 decimals))
			)

			;; Enable extensions.
			(try! (contract-call? .executor-dao set-extensions
				(list
					{extension: .sde-vault, enabled: true}
					{extension: .sde-governance-token, enabled: true}
					{extension: .sde-proposal-submission-with-delegation, enabled: true}
					{extension: .sde-proposal-voting-with-delegation, enabled: true}
				)
			))

			;; Whitelist token
			(try! (contract-call? .sde-vault set-whitelist .sde-governance-token true))

			;; Mint 237,500k tokens to the DAO treasury upon initialization.
			(try! (contract-call? .sde-governance-token mint (* microTokens u97000000) .sde-vault))
			;; Mint 12,500 tokens (min for delegation and quorum) to the deployer.
			(try! (contract-call? .sde-governance-token mint (* microTokens u1000000) sender))
			(try! (contract-call? .sde-governance-token mint (* microTokens u500000) 'ST2ST2H80NP5C9SPR4ENJ1Z9CDM9PKAJVPYWPQZ50))
			(try! (contract-call? .sde-governance-token mint (* microTokens u1500000) 'ST2Y2SFNVZBT8SSZ00XXKH930MCN0RFREB2GQG7CJ))
			

			(print {message: "...to be a completely separate network and separate block chain, yet share CPU power with Bitcoin.", sender: sender})
			(ok true)
		)
	)
)
