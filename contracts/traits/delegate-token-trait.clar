(define-trait delegate-token-trait
	(
		(has-percentage-weight (principal uint) (response bool uint))
		(get-balance (principal) (response uint uint))
		(mint (uint principal) (response bool uint))
		(burn (uint principal) (response bool uint))
	)
)
