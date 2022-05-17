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

;; Title: Governance Token with Lockup
;; Author: StackerDAO Dev Team
;; Description:
;; The governance token is a simple SIP010-compliant fungible token 
;; with some added functions to make it easier to manage by
;; StackerDAO proposals and extensions.

(impl-trait .delegate-token-trait.delegate-token-trait)
(impl-trait .sip010-ft-trait.sip010-ft-trait)
(impl-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u2400))
(define-constant ERR_NOT_TOKEN_OWNER (err u2401))
(define-constant ERR_NOT_ENOUGH_TOKENS (err u2403))
(define-constant ERR_INVALID_WEIGHT (err u2404))

(define-fungible-token Governance-Token)

(define-data-var tokenName (string-ascii 32) "Governance Token")
(define-data-var tokenSymbol (string-ascii 10) "GT")
(define-data-var tokenUri (optional (string-utf8 256)) none)
(define-data-var tokenDecimals uint u6)

(define-map Delegators principal { delegatee: principal, weight: uint })
(define-map Delegatees principal uint)

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

(define-public (mint (amount uint) (recipient principal))
	(begin
		;; (try! (is-dao-or-extension))
		(ft-mint? Governance-Token amount recipient)
	)
)

(define-public (burn (amount uint) (owner principal))
	(begin
		(try! (is-dao-or-extension))
		(ft-burn? Governance-Token amount owner)
	)
)

;; --- Public functions

(define-public (set-name (newName (string-ascii 32)))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set tokenName newName))
	)
)

(define-public (set-symbol (newSymbol (string-ascii 10)))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set tokenSymbol newSymbol))
	)
)

(define-public (set-decimals (newDecimals uint))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set tokenDecimals newDecimals))
	)
)

(define-public (set-token-uri (newUri (optional (string-utf8 256))))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set tokenUri newUri))
	)
)

(define-private (mint-many-iter (item {amount: uint, recipient: principal}))
	(ft-mint? Governance-Token (get amount item) (get recipient item))
)

(define-public (mint-many (recipients (list 200 {amount: uint, recipient: principal})))
	(begin
		(try! (is-dao-or-extension))
		(ok (map mint-many-iter recipients))
	)
)

;; --- SIP010 traits

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
	(begin
		(let
			(
				(delegateSender (map-get? Delegators sender))
				(delegateRecipient (map-get? Delegators recipient))
			)

			(asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender)) ERR_NOT_TOKEN_OWNER)
			(if (is-some delegateSender)
				(begin
					;; Decrement the delegated weight of the sender to their delegatee
					(map-set Delegators (unwrap-panic (get delegatee delegateSender)) { delegatee: (unwrap-panic (get delegatee delegateSender)), weight: (- (unwrap-panic (get weight delegateSender)) amount) })
					;; Delegate the power of the delegatee
					(map-set Delegatees (unwrap-panic (get delegatee delegateSender)) (- (unwrap-panic (get weight delegateSender)) amount))
				)
				false
			)
			(ft-transfer? Governance-Token amount sender recipient)
		)
	)
)

(define-read-only (get-name)
	(ok (var-get tokenName))
)

(define-read-only (get-symbol)
	(ok (var-get tokenSymbol))
)

(define-read-only (get-decimals)
	(ok (var-get tokenDecimals))
)

(define-read-only (get-balance (who principal))
	(ok (ft-get-balance Governance-Token who))
)

(define-read-only (get-total-supply)
	(ok (ft-get-supply Governance-Token))
)

(define-read-only (get-token-uri)
	(ok (var-get tokenUri))
)

;; --- Delegate token traits

(define-public (delegate-votes (delegatee principal) (delegator principal))
	(begin
		(let
			(
				(currentDelegatee (unwrap-panic (map-get? Delegatees delegatee)))
				(currentVotingWeight (unwrap-panic (map-get? Delegatees delegatee)))
			)

			(asserts! (or (is-eq tx-sender delegator) (is-eq contract-caller delegator)) ERR_NOT_TOKEN_OWNER)
			(asserts! (> (unwrap-panic (get-balance delegator)) u0) ERR_INVALID_WEIGHT)
			;; require revoke-delegation before delegating to another principal
			(map-set Delegators delegator { delegatee: delegatee, weight: (unwrap-panic (get-balance delegator)) })
			(ok (map-set Delegatees delegatee (+ (unwrap-panic (get-balance delegator)) currentVotingWeight)))
		)
	)
)

(define-public (revoke-delegation (delegatee principal) (delegator principal) (weight uint))
	(begin
		(asserts! (or (is-eq tx-sender delegator) (is-eq contract-caller delegator)) ERR_NOT_TOKEN_OWNER)
		(asserts! (<= (unwrap-panic (get-balance delegator)) weight) ERR_INVALID_WEIGHT)
		(map-set Delegators delegator { delegatee: delegatee, weight: weight })
		(ok (map-set Delegatees delegatee weight))
	)
)

(define-read-only (has-percentage-balance (who principal) (factor uint))
	(ok (>= (* (unwrap-panic (get-balance who)) factor) (* (unwrap-panic (get-total-supply)) u1000)))
)

(define-read-only (get-voting-weight (voter principal))
	(ok (default-to u0 (map-get? Delegatees voter)))
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
