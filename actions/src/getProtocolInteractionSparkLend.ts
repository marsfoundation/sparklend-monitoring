import {
	ActionFn,
	Context,
	Event,
	TransactionEvent,
} from '@tenderly/actions'

import {
	poolAbi,
	oracleAbi,
	erc20Abi,
} from './abis'

import {
	formatBigInt,
	sendMessagesToSlack,
} from './utils'

const ethers = require('ethers')

const POOL_ADDRESS = "0xC13e21B648A5Ee794902342038FF3aDAB66BE987"
const ORACLE_ADDRESS = "0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9"

export const getProtocolInteractionSparkLend: ActionFn = async (context: Context, event: Event) => {
	let txEvent = event as TransactionEvent

	const rpcUrl = await context.secrets.get('ETH_RPC_URL')
	const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

	const pool = new ethers.Contract(POOL_ADDRESS, poolAbi, provider)
	const oracle = new ethers.Contract(ORACLE_ADDRESS, oracleAbi, provider)

	const assets = await pool.getReservesList() as any[]

	const prices = await Promise.all(assets.map(async asset => await oracle.getAssetPrice(asset)))
	const decimals = await Promise.all(assets.map(async asset => await new ethers.Contract(asset, erc20Abi, provider).decimals()))
	const symbols = await Promise.all(assets.map(async asset => await new ethers.Contract(asset, erc20Abi, provider).symbol()))
	const reserveDataSets = await Promise.all(assets.map(async asset => await pool.getReserveData(asset)))
	const totalSupply =  await Promise.all(assets.map(async (_ ,index) => await new ethers.Contract(reserveDataSets[index][8], erc20Abi, provider).totalSupply()))
	const collateralPositions = await Promise.all(assets.map(async (_ ,index) => await new ethers.Contract(reserveDataSets[index][8], erc20Abi, provider).balanceOf(txEvent.from)))
	const totalDebt = await Promise.all(assets.map(async (_ ,index) => await new ethers.Contract(reserveDataSets[index][10], erc20Abi, provider).totalSupply()))
	const debtPositions = await Promise.all(assets.map(async (_ ,index) => await new ethers.Contract(reserveDataSets[index][10], erc20Abi, provider).balanceOf(txEvent.from)))

	const assetData = assets.reduce((assetData, asset, index) => (
		assetData[asset] = {
			price: prices[index],
			decimals: decimals[index],
			symbol: symbols[index],
			totalSupply: totalSupply[index],
			usersCollateral: {
				balance: collateralPositions[index],
				value: BigInt(collateralPositions[index])
					* BigInt(prices[index])
					/ BigInt(10 ** decimals[index])
					/ BigInt(10 ** 6) // dividing by 10 ** 6, not 10 ** 8 because we want the result in USD cents
			},
			totalDebt: totalDebt[index],
			usersDebt: {
				balance: debtPositions[index],
				value: BigInt(debtPositions[index])
					* BigInt(prices[index])
					/ BigInt(10 ** decimals[index])
					/ BigInt(10 ** 6) // dividing by 10 ** 6, not 10 ** 8 because we want the result in USD cents
			},
		}, assetData
	), {})

	const filteredParsedPoolLogs = txEvent.logs
		.filter(log => log.address.toLowerCase() == POOL_ADDRESS.toLowerCase())
		.map(log => pool.interface.parseLog(log))
		.filter(log => log.name == 'Supply' || log.name == 'Borrow' || log.name == 'Withdraw' || log.name == 'Repay')

	const formattedActions = filteredParsedPoolLogs
		.map(log => processLog(log, txEvent, assetData))

	console.log(formattedActions.map(action => action.message))

	const filteredActions = formattedActions
		.filter(action => action.value > BigInt(100000000)) // value bigger than $1.000.000 in cents

	console.log(filteredActions.map(action => action.message))

	await sendMessagesToSlack(filteredActions.map(action => action.message), context, 'SPARKLEND_ALERTS_SLACK_WEBHOOK_URL')
}

const processLog = (
	log: any,
	txEvent: TransactionEvent,
	assetData: any,
) => {
	const value = BigInt(log.args.amount) // value in USD cents
		* BigInt(assetData[log.args.reserve].price)
		/ BigInt(10 ** assetData[log.args.reserve].decimals)
		/ BigInt(10 ** 6) // dividing by 10 ** 6, not 10 ** 8 because we want the result in USD cents

	const message = formatProtocolInteractionAlertMessage(
		log,
		txEvent,
		assetData,
	)

	return {
		value,
		message,
	}
}

const formatProtocolInteractionAlertMessage = (
	log: any,
	txEvent: TransactionEvent,
	assetData: any,
) => {

	const collateralPositions = Object.keys(assetData).map(asset => ({
		symbol: assetData[asset].symbol,
		decimals: assetData[asset].decimals,
		amount: assetData[asset].usersCollateral.balance,
		value: assetData[asset].usersCollateral.value,
	}))
	.filter(position => position.value > BigInt(100000)) // value bigger than $1.000 in cents
	.map(position => `
	${formatBigInt(BigInt(position.amount)/BigInt(10 ** position.decimals), 0)} ${position.symbol} ($${formatBigInt(BigInt(position.value)/BigInt(10 ** 7), 1)}M)`)

	const totalCollateralValue = Object.keys(assetData)
		.map(asset => assetData[asset].usersCollateral.value)
		.reduce((collateral, totalCollateral) => totalCollateral += collateral, BigInt(0))
	console.log({totalCollateralValue})

	const debtPositions = Object.keys(assetData).map(asset => ({
		symbol: assetData[asset].symbol,
		decimals: assetData[asset].decimals,
		amount: assetData[asset].usersDebt.balance,
		value: assetData[asset].usersDebt.value,
	}))
	.filter(position => position.value > BigInt(100000)) // value bigger than $1.000 in cents
	.map(position => `
	${formatBigInt(BigInt(position.amount)/BigInt(10 ** position.decimals), 0)} ${position.symbol} ($${formatBigInt(BigInt(position.value)/BigInt(10 ** 7), 1)}M)`)

	const totalDebtValue = Object.keys(assetData)
		.map(asset => assetData[asset].usersDebt.value)
		.reduce((debt, totalDebt) => totalDebt += debt, BigInt(0))
	console.log({totalDebtValue})

	const transactionValue = BigInt(log.args.amount)
		* BigInt(assetData[log.args.reserve].price)
		/ BigInt(10 ** assetData[log.args.reserve].decimals)
		/ BigInt(10 ** 6)

	const totalSupplyValue = BigInt(assetData[log.args.reserve].totalSupply)
		* BigInt(assetData[log.args.reserve].price)
		/ BigInt(10 ** assetData[log.args.reserve].decimals)
		/ BigInt(10 ** 6)

	const poolUtilization = BigInt(100)
		* BigInt(assetData[log.args.reserve].totalDebt)
		/ BigInt(assetData[log.args.reserve].totalSupply)


	return `
		\`\`\`
${log.name.toUpperCase()}: ${formatBigInt(BigInt(log.args.amount)/BigInt( 10 ** assetData[log.args.reserve].decimals), 0)} ${assetData[log.args.reserve].symbol} ($${formatBigInt(transactionValue/BigInt(10 ** 7), 1)}M)
USER:   ${txEvent.from.slice(0, 7)}...${txEvent.from.slice(36, 41)}
POOL:   $${totalSupplyValue/BigInt(10 ** 8)}M (util. ${poolUtilization}%)

${txEvent.from}
COLLATERAL ($${formatBigInt(totalCollateralValue/BigInt(10 ** 7), 1)}M):${collateralPositions.join('')}
DEBT ($${formatBigInt(totalDebtValue/BigInt(10 ** 7), 1)}M):${debtPositions.join('')}

Transaction hash: ${txEvent.hash}
(https://etherscan.io/tx/${txEvent.hash})\`\`\``
}
