export const getDevianceInBasisPoints = (a: bigint, b: bigint): bigint => {
	if (a == b) return 0n

	const values = a > b ? [a, b] : [b, a]

	return (values[0] - values[1]) * 10_000n / values[1]
}
