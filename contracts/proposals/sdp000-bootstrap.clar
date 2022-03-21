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

;; Title: SDP000 Create
;; Author: Marvin Janssen / StackerDAO Dev Team
;; Synopsis:
;; Boot proposal that sets the governance token, DAO parameters, and extensions, and
;; mints the initial governance tokens.
;; Description:
;; Mints the initial supply of governance tokens and enables the the following 
;; extensions: "SDE000 Governance Token", "SDE001 Proposal Voting",
;; "SDE002 Proposal Submission", "SDE003 Emergency Proposals",
;; "SDE004 Emergency Execute".

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; Enable genesis extensions.
		(try! (contract-call? .executor-dao set-extensions
			(list
				{extension: .sde009-safe, enabled: true}
				{extension: .sde013-multisig, enabled: true}
			)
		))

		;; Whitelist fungible tokens in safe.
		(try! (contract-call? .sde009-safe set-whitelists
			(list
				{token: .citycoin-token, enabled: true}
			)
		))

		;; Set emergency team members.
		(try! (contract-call? .sde013-multisig add-signer 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM))
		(try! (contract-call? .sde013-multisig add-signer 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
		(try! (contract-call? .sde013-multisig add-signer 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))

		(print "...to be a completely separate network and separate block chain, yet share CPU power with Bitcoin.")
		(ok true)
	)
)
