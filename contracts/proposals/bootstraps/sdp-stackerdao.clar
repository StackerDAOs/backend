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
				(decimals (unwrap-panic (contract-call? .sde-stackerdao-token get-decimals)))
				(microTokens (pow u10 decimals))
			)

			;; Enable extensions.
			(try! (contract-call? .executor-dao set-extensions
				(list
					{extension: .sde-vault, enabled: true}
					{extension: .sde-stackerdao-token, enabled: true}
					{extension: .sde-proposal-submission, enabled: true}
					{extension: .sde-proposal-voting, enabled: true}
				)
			))

			;; Whitelist token
			(try! (contract-call? .sde-vault set-whitelist .sde-stackerdao-token true))
      (try! (contract-call? .sde-vault set-whitelist .sde-miamicoin-token true))
      (try! (contract-call? .sde-vault set-whitelist .sde-newyorkcoin-token true))

			;; Change minimum start delay
			(try! (contract-call? .sde-proposal-submission set-parameter "minimumProposalStartDelay" u25))

			;; Change duration of voting
			(try! (contract-call? .sde-proposal-submission set-parameter "proposalDuration" u75))

			;; Change execution delay
			(try! (contract-call? .sde-proposal-voting set-parameter "executionDelay" u25))

			;; Mint 237,500k tokens to the DAO treasury upon initialization.
			(try! (contract-call? .sde-stackerdao-token mint (* microTokens u700000) .sde-vault))
      (try! (contract-call? .sde-miamicoin-token mint (* microTokens u215000) .sde-vault))
      (try! (contract-call? .sde-newyorkcoin-token mint (* microTokens u185750) .sde-vault))
			
			;; Mint 12,500 tokens (min for delegation and quorum) to the deployer.
			(try! (contract-call? .sde-stackerdao-token mint (* microTokens u100000) sender))
			(try! (contract-call? .sde-stackerdao-token mint (* microTokens u100000) 'ST2ST2H80NP5C9SPR4ENJ1Z9CDM9PKAJVPYWPQZ50))
			(try! (contract-call? .sde-stackerdao-token mint (* microTokens u100000) 'ST2Y2SFNVZBT8SSZ00XXKH930MCN0RFREB2GQG7CJ))
			

			(print {message: "...to be a completely separate network and separate block chain, yet share CPU power with Bitcoin.", sender: sender})
			(ok true)
		)
	)
)
