(define-trait delegate-token-trait
	(
		(has-percentage-weight (principal uint) (response bool uint))
		(delegate (principal principal) (response bool uint))
		(get-voting-weight (principal) (response uint uint))
		(mint (uint principal) (response bool uint))
		(burn (uint principal) (response bool uint))
	)
)
