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

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
  (begin
    ;; Enable genesis extensions.
    (try! (contract-call? .executor-dao set-extensions
      (list
        {extension: .sde006-membership, enabled: true}
        {extension: .sde009-safe, enabled: true}
        {extension: .sde007-proposal-voting, enabled: true}
        {extension: .sde008-proposal-submission, enabled: true}
      )
    ))

    (print "...to be a completely separate network and separate block chain, yet share CPU power with Bitcoin.")
    (ok true)
  )
)
