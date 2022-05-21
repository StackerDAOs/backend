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
		;; Enable genesis extensions.
		(try! (contract-call? .executor-dao set-extensions
			(list
				{extension: .sde-vault, enabled: true}
        {extension: .sde-governance-token-with-delegation, enabled: true}
				{extension: .sde-proposal-submission-with-delegation, enabled: true}
        {extension: .sde-proposal-voting-with-delegation, enabled: true}
			)
		))

		;; Mint 250k tokens to the DAO treasury upon initialization.
		(try! (contract-call? .sde-governance-token-with-delegation mint u250000 .sde-vault))
		;; -- TESTING -- Mint 2,500 tokens (min for delegation) to the deployer.
		(try! (contract-call? .sde-governance-token-with-delegation mint u2500 sender))

		(print "...to be a completely separate network and separate block chain, yet share CPU power with Bitcoin.")
		(ok true)
	)
)
