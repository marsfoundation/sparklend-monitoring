import {
	AssetData
} from '../types'

export const createPoolStateOutline = (assetData: AssetData) => {
	const totalSupplyValue = assetData.totalSupply
		* assetData.price
		/ BigInt(10) ** assetData.decimals
		/ BigInt(10 ** 6)

	const poolUtilization = BigInt(100)
		* assetData.totalDebt
		/ assetData.totalSupply

	return `$${totalSupplyValue/BigInt(10 ** 8)}M (util. ${poolUtilization}%)`
}
