export function formatBigInt(value: any, decimals: any): string {
	const integerPart = BigInt(value) / BigInt(10 ** decimals)
	const fractionalPart = BigInt(value) % BigInt(10 ** decimals)
	const fractionalString = fractionalPart.toString().padStart(decimals, '0')
	const integerPartString = integerPart.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,')
	return `${integerPartString}.${fractionalString}`
}
