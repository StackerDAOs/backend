;; Title: SIP10 Governance Token
;; Author: StackerDAO Dev Team
;; Description:

(impl-trait .sip010-ft-trait.sip010-ft-trait)

(define-constant ERR_UNAUTHORIZED (err u2400))
(define-constant ERR_NOT_TOKEN_OWNER (err u2401))

(define-constant TOTAL_SUPPLY (* (pow u10 u2) u1000000))

(define-fungible-token StackerDAO TOTAL_SUPPLY) ;; 1m tokens

(define-data-var tokenName (string-ascii 32) "StackerDAO")
(define-data-var tokenSymbol (string-ascii 10) "SDAO")
(define-data-var tokenUri (optional (string-utf8 256)) none)
(define-data-var tokenDecimals uint u2)

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

(define-public (mint (amount uint) (recipient principal))
	(begin
		(try! (is-dao-or-extension))
		(ft-mint? StackerDAO amount recipient)
	)
)

;; --- Public functions

(define-public (burn (amount uint) (owner principal))
	(begin
		(asserts! (or (is-eq tx-sender owner) (is-eq contract-caller owner)) ERR_NOT_TOKEN_OWNER)
		(ft-burn? StackerDAO amount owner)
	)
)

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
	(ft-mint? StackerDAO (get amount item) (get recipient item))
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
		(asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender)) ERR_NOT_TOKEN_OWNER)
		(ft-transfer? StackerDAO amount sender recipient)
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
	(ok (ft-get-balance StackerDAO who))
)

(define-read-only (get-total-supply)
	(ok (ft-get-supply StackerDAO))
)

(define-read-only (get-token-uri)
	(ok (var-get tokenUri))
)