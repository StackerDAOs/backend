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

;; Title: SDP Multisignature DAO
;; Author: StackerDAO Dev Team
;; Type: Bootstrap

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; Enable extensions.
		(try! (contract-call? .executor-dao set-extensions
			(list
				{extension: .sde-vault, enabled: true}
				{extension: .sde-multisig, enabled: true}
			)
		))

		;; Whitelist fungible tokens for the vault.
		(try! (contract-call? .sde-vault set-whitelists
			(list
				{token: .citycoin-token, enabled: true}
			)
		))

		;; Add members to the multisig.
		(try! (contract-call? .sde-multisig add-signer 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM))
		(try! (contract-call? .sde-multisig add-signer 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
		(try! (contract-call? .sde-multisig add-signer 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))

		(print "...to be a completely separate network and separate block chain, yet share CPU power with Bitcoin.")
		(ok true)
	)
)
