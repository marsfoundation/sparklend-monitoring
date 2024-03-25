import { AssetData } from './types'

export const calculateDollarValueInCents = (assetData: AssetData, amount: bigint) => {
	return amount
		* assetData.price
		/ BigInt(10) ** assetData.decimals
		/ BigInt(10 ** 6) // dividing by 10 ** 6, not 10 ** 8 because we want the result in USD cents (we assume 8 digit precision)
}
