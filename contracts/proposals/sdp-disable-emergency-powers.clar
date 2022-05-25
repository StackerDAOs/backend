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

;; Title: SDP Disable Emergency Powers
;; Author: StackerDAO Dev Team
;; Type: Operational
;; Description:
;; Disabled both emergency extensions and removes the ability to
;; propose and execute any emergency proposals on behalf of the DAO.

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
    (try! (contract-call? .executor-dao set-extension .sde-emergency-execute false))
    (try! (contract-call? .executor-dao set-extension .sde-emergency-proposals false))

    (print {message: "Execute proposal", sender: sender})
    (ok true)
  )
)
