(define-trait delegate-token-trait
	(
		(has-percentage-balance (principal uint) (response bool uint))
		(delegate-votes (principal principal) (response bool uint))
		(get-voting-weight (principal) (response uint uint))
		(mint (uint principal) (response bool uint))
		(burn (uint principal) (response bool uint))
	)
)
