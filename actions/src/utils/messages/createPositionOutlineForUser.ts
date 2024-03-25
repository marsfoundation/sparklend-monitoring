import {
	formatBigInt
} from './formatBigInt'

import {
	omitKey
} from '../omitKey'

import {
	AssetsData,
} from '../types'

export const createPositionOutlineForUser = (assetsData: AssetsData): string => {
	const collateralPositions = Object.keys(omitKey(assetsData, 'user')).map(asset => ({
		symbol: assetsData[asset].symbol,
		decimals: assetsData[asset].decimals,
		amount: assetsData[asset].usersCollateral.balance,
		value: assetsData[asset].usersCollateral.value,
	}))
		.filter(position => position.value > BigInt(100000)) // value bigger than $1.000 in cents
		.map(position => `
	${formatBigInt(position.amount/BigInt(10) ** position.decimals, 0)} ${position.symbol} ($${formatBigInt(position.value/BigInt(10 ** 7), 1)}M)`)

	const totalCollateralValue = Object.keys(omitKey(assetsData, 'user'))
		.map(asset => assetsData[asset].usersCollateral.value)
		.reduce((collateral, totalCollateral) => totalCollateral += collateral, BigInt(0))

	const debtPositions = Object.keys(omitKey(assetsData, 'user')).map(asset => ({
		symbol: assetsData[asset].symbol,
		decimals: assetsData[asset].decimals,
		amount: assetsData[asset].usersDebt.balance,
		value: assetsData[asset].usersDebt.value,
	}))
		.filter(position => position.value > BigInt(100000)) // value bigger than $1.000 in cents
		.map(position => `
	${formatBigInt(BigInt(position.amount)/BigInt(BigInt(10) ** BigInt(position.decimals)), 0)} ${position.symbol} ($${formatBigInt(BigInt(position.value)/BigInt(10 ** 7), 1)}M)`)

	const totalDebtValue = Object.keys(omitKey(assetsData, 'user'))
		.map(asset => assetsData[asset].usersDebt.value)
		.reduce((debt, totalDebt) => totalDebt += debt, BigInt(0))

	return `${assetsData.user}
💰 COLLATERAL ($${formatBigInt(totalCollateralValue/BigInt(10 ** 7), 1)}M):${collateralPositions.join('')}
📝 DEBT ($${formatBigInt(totalDebtValue/BigInt(10 ** 7), 1)}M):${debtPositions.join('')}`
}
