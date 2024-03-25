import {
	Contract,
	JsonRpcProvider,
} from 'ethers'

import {
	erc20Abi,
} from '../abis'

import {
	AssetsData,
} from './types'

export const fetchAllAssetsData = async (user: string, pool: Contract, oracle: Contract, provider: JsonRpcProvider): Promise<AssetsData> => {
	const assets = await pool.getReservesList() as any[]

	const prices = await Promise.all(assets.map(async asset => BigInt(await oracle.getAssetPrice(asset))))
	const decimals = await Promise.all(assets.map(async asset => BigInt(await new Contract(asset, erc20Abi, provider).decimals())))
	const symbols = await Promise.all(assets.map(async asset => await new Contract(asset, erc20Abi, provider).symbol()))
	const reserveDataSets = await Promise.all(assets.map(async asset => await pool.getReserveData(asset)))
	const totalSupply =  await Promise.all(assets.map(async (_ ,index) => BigInt(await new Contract(reserveDataSets[index][8], erc20Abi, provider).totalSupply())))
	const collateralPositions = await Promise.all(assets.map(async (_ ,index) => await new Contract(reserveDataSets[index][8], erc20Abi, provider).balanceOf(user)))
	const totalDebt = await Promise.all(assets.map(async (_ ,index) => BigInt(await new Contract(reserveDataSets[index][10], erc20Abi, provider).totalSupply())))
	const debtPositions = await Promise.all(assets.map(async (_ ,index) => BigInt(await new Contract(reserveDataSets[index][10], erc20Abi, provider).balanceOf(user))))

	return {...assets.reduce((assetData, asset, index) => (
		assetData[asset] = {
			price: prices[index],
			decimals: decimals[index],
			symbol: symbols[index],
			totalSupply: totalSupply[index],
			usersCollateral: {
				balance: collateralPositions[index],
				value: collateralPositions[index]
					* prices[index]
					/ BigInt(10) ** decimals[index]
					/ BigInt(10 ** 6) // dividing by 10 ** 6, not 10 ** 8 because we want the result in USD cents
			},
			totalDebt: totalDebt[index],
			usersDebt: {
				balance: debtPositions[index],
				value: debtPositions[index]
					* prices[index]
					/ BigInt(10) ** decimals[index]
					/ BigInt(10 ** 6) // dividing by 10 ** 6, not 10 ** 8 because we want the result in USD cents
			},
		}, assetData
	), {}), user}
}
