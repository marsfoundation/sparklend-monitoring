import {
	Context,
	Event,
	TransactionEvent,
} from '@tenderly/actions'

import {
	Contract,
	LogDescription,
} from 'ethers'

import {
	oracleAbi,
	poolAbi,
} from './abis'

import {
	AssetsData,
	createEtherscanTxLink,
	createPoolStateOutline,
	createPositionOutlineForUser,
	createProvider,
	fetchAllAssetsData,
	formatAssetAmount,
	sendMessagesToSlack,
	shortenAddress,
	transactionAlreadyProcessed,
} from './utils'

import {
	HIGH_GAS_TRANSACTION_THRESHOLD
} from './getHighGasTransaction'

export const getLiquidationSparkLend = (
	rpcUrlSecret: string,
	instanceName: string,
	poolAddress: string,
	oracleAddress: string,
	slackWebhookUrlSecret: string,
	slackMessagePrefix: string,
) => async (context: Context, event: Event) => {
	const txEvent = event as TransactionEvent

	if (await transactionAlreadyProcessed(`getLiquidationSparkLend-${instanceName}`, context, txEvent)) return

	const provider = await createProvider(context, rpcUrlSecret)

	const pool = new Contract(poolAddress, poolAbi, provider)
	const oracle = new Contract(oracleAddress, oracleAbi, provider)

	const liquidationLogs = txEvent.logs
		.filter(log => log.address.toLowerCase() == poolAddress.toLowerCase())
		.map(log => pool.interface.parseLog(log))
		.filter(log => log?.name == 'LiquidationCall')

	const slackMessages = await Promise.all(
		liquidationLogs.map(async (log) => {
			const allAssetsData = await fetchAllAssetsData(log && log.args[2], pool, oracle, provider)
			return log && `\`\`\`${slackMessagePrefix}${formatLiquidationMessage(allAssetsData, log, txEvent)}\`\`\``
		})
	) as string[]

	await sendMessagesToSlack(slackMessages, context, slackWebhookUrlSecret)

}

const formatLiquidationMessage = (allAssetsData: AssetsData, log: LogDescription, txEvent: TransactionEvent) => {
	console.log(log.args)
	return `
❌ LIQUIDATED:   ${formatAssetAmount(allAssetsData[log.args[0]], log.args[4])}
📝 DEBT COVERED: ${formatAssetAmount(allAssetsData[log.args[1]], log.args[3])}
👨‍💼 USER:         ${shortenAddress(log.args[2])}
🥷 LIQUIDATOR:   ${shortenAddress(log.args[5])}
🏦 POOL:         ${createPoolStateOutline(allAssetsData[log.args[0]])}

${createPositionOutlineForUser(allAssetsData)}

${BigInt(txEvent.gasUsed) >= HIGH_GAS_TRANSACTION_THRESHOLD ? '⛽️🔥 HIGH GAS TRANSACTION ⛽️🔥\n' : ''}${createEtherscanTxLink(txEvent.hash)}`
}

export const getLiquidationSparkLendMainnet = getLiquidationSparkLend(
	'ETH_RPC_URL',
	'mainnet',
	'0xC13e21B648A5Ee794902342038FF3aDAB66BE987',
	'0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9',
	'SPARKLEND_INFO_SLACK_WEBHOOK_URL',
	'',
)

export const getLiquidationSparkLendGnosis = getLiquidationSparkLend(
	'GNOSIS_RPC_URL',
	'gnosis',
	'0x2Dae5307c5E3FD1CF5A72Cb6F698f915860607e0',
	'0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9',
	'SPARKLEND_INFO_GNOSIS_SLACK_WEBHOOK_URL',
	'🦉 GNOSIS CHAIN 🦉\n',
)
