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
				(decimals (unwrap-panic (contract-call? .sde-governance-token-with-delegation get-decimals)))
				(microTokens (pow u10 decimals))
			)

			;; Enable extensions.
			(try! (contract-call? .executor-dao set-extensions
				(list
					{extension: .sde-vault, enabled: true}
					{extension: .sde-governance-token-with-delegation, enabled: true}
					{extension: .sde-proposal-submission-with-delegation, enabled: true}
					{extension: .sde-proposal-voting-with-delegation, enabled: true}
				)
			))

			;; Whitelist token
			(try! (contract-call? .sde-vault set-whitelist .sde-governance-token-with-delegation true))

			;; Mint 237,500k tokens to the DAO treasury upon initialization.
			(try! (contract-call? .sde-governance-token-with-delegation mint (* microTokens u237500) .sde-vault))
			;; Mint 12,500 tokens (min for delegation and quorum) to the deployer.
			(try! (contract-call? .sde-governance-token-with-delegation mint (* microTokens u6000) sender))
			(try! (contract-call? .sde-governance-token-with-delegation mint (* microTokens u2500) 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
			(try! (contract-call? .sde-governance-token-with-delegation mint (* microTokens u2000) 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))
			(try! (contract-call? .sde-governance-token-with-delegation mint (* microTokens u2000) 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC))
			

			(print {message: "...to be a completely separate network and separate block chain, yet share CPU power with Bitcoin.", sender: sender})
			(ok true)
		)
	)
)
