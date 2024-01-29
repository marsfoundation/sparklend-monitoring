import {
	formatBigInt
} from './formatBigInt'

import {
	AssetsData,
	calculateDollarValueInCents,
} from '..'

export const formatAssetAmount = (allAssetsData: AssetsData, asset: string, amount: bigint) => {
	const transactionValue = calculateDollarValueInCents(
		allAssetsData,
		amount,
		asset,
	)

	const dollarValueString = transactionValue >= BigInt(100_000_00)
		? `$${formatBigInt(transactionValue/BigInt(10) ** BigInt(7), 1)}M`
		: `$${formatBigInt(transactionValue/BigInt(10) ** BigInt(4), 1)}k`

	return `${formatBigInt(amount / BigInt(10) ** (allAssetsData[asset].decimals - BigInt(1)), 1)} ${allAssetsData[asset].symbol} (${dollarValueString})`
}
