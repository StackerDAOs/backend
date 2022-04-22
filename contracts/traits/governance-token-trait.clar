(define-trait governance-token-trait
	(
		(has-percentage-balance (principal uint) (response bool uint))
		(lock (uint principal) (response bool uint))
		(unlock (uint principal) (response bool uint))
		(get-locked (principal) (response uint uint))
		(mint (uint principal) (response bool uint))
		(burn (uint principal) (response bool uint))
	)
)
