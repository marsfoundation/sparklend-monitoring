import {
	formatBigInt
} from './formatBigInt'

import {
	AssetData,
	calculateDollarValueInCents,
} from '..'

export const formatAssetAmount = (assetData: AssetData, amount: bigint) => {
	const transactionValue = calculateDollarValueInCents(
		assetData,
		amount,
	)

	const dollarValueString = transactionValue >= BigInt(100_000_00)
		? `$${formatBigInt(transactionValue/BigInt(10) ** BigInt(7), 1)}M`
		: `$${formatBigInt(transactionValue/BigInt(10) ** BigInt(4), 1)}k`

	return `${formatBigInt(amount / BigInt(10) ** (assetData.decimals - BigInt(1)), 1)} ${assetData.symbol} (${dollarValueString})`
}
