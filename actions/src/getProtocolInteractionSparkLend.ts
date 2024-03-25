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
	poolAbi,
	oracleAbi,
} from './abis'

import {
	AssetsData,
	aliases,
	calculateDollarValueInCents,
	createD3MOutline,
	createEtherscanTxLink,
	createGnosisscanTxLink,
	createPoolStateOutline,
	createPositionOutlineForUser,
	createProvider,
	fetchAllAssetsData,
	formatAssetAmount,
	getAddressAlias,
	getUsersFromParsedLogs,
	sendMessagesToSlack,
	shortenAddress,
	transactionAlreadyProcessed,
} from './utils'

import {
	HIGH_GAS_TRANSACTION_THRESHOLD
} from './getHighGasTransaction'

const getProtocolInteractionSparkLend = (
	rpcUrlSecret: string,
	instanceName: string,
	poolAddress: string,
	oracleAddress: string,
	slackWebhookUrlSecret: string,
	dollarValueThreshold: number,
	slackMessagePrefix: string,
	createTxLink: (hash: string) => string,
) => async (context: Context, event: Event) => {
	let txEvent = event as TransactionEvent

	if (await transactionAlreadyProcessed(`getProtocolInteractionSparklend-${instanceName}`, context, txEvent)) return

	const provider = await createProvider(context, rpcUrlSecret)

	const pool = new Contract(poolAddress, poolAbi, provider)
	const oracle = new Contract(oracleAddress, oracleAbi, provider)

	const preFilteredLogs = txEvent.logs
		.filter(log => log.address.toLowerCase() == poolAddress.toLowerCase())
		.map(log => pool.interface.parseLog(log))
		.filter(log => log?.name == 'Supply' || log?.name == 'Borrow' || log?.name == 'Withdraw' || log?.name == 'Repay')

	const users = getUsersFromParsedLogs(preFilteredLogs as LogDescription[])

	const allAssetsDataForAllUsers: Record<string, AssetsData> = (await Promise.all(users.map(user => fetchAllAssetsData(user, pool, oracle, provider))))
		.reduce((acc, curr, index) => {return {...acc, [users[index]]: curr}}, {})

	const slackMessages = preFilteredLogs
		.filter(log => log && calculateDollarValueInCents(allAssetsDataForAllUsers[log.args.user][log.args.reserve], log.args.amount) > BigInt(dollarValueThreshold * 100)) // value bigger than $1.000.000 in cents
		.map(log => log && `\`\`\`${slackMessagePrefix}${formatProtocolInteractionAlertMessage(log, txEvent, allAssetsDataForAllUsers[log.args.user], createTxLink)}\`\`\``) as string[]

	await sendMessagesToSlack(slackMessages, context, slackWebhookUrlSecret)
}

const formatProtocolInteractionAlertMessage = (
	log: LogDescription,
	txEvent: TransactionEvent,
	allAssetsData: AssetsData,
	createTxLink: (hash: string) => string,
) => {
	const title = formatInteractionName(log.name)
	return `
${title}: ${formatAssetAmount(allAssetsData[log.args.reserve], log.args.amount)}
👨‍💼 USER:${' '.repeat(title.length - 6)}${getAddressAlias(log.args.user) || shortenAddress(log.args.user)}
🏦 POOL:${' '.repeat(title.length - 6)}${createPoolStateOutline(allAssetsData[log.args.reserve])}

${getAddressAlias(log.args.user) == aliases.MAKER_CORE_D3M && allAssetsData[log.args.reserve].symbol == 'DAI'
	? createD3MOutline(allAssetsData[log.args.reserve])
	: createPositionOutlineForUser(allAssetsData)}

${BigInt(txEvent.gasUsed) >= HIGH_GAS_TRANSACTION_THRESHOLD ? '⛽️🔥 HIGH GAS TRANSACTION ⛽️🔥\n' : ''}${createTxLink(txEvent.hash)}`
}

const formatInteractionName = (name: string) => {
	if(name == 'Supply') return '💰 SUPPLY'
	if(name == 'Withdraw') return '💸 WITHDRAW'
	if(name == 'Borrow') return '📝 BORROW'
	if(name == 'Repay') return '🤑 REPAY'
	return ''
}

export const getProtocolInteractionSparkLendMainnet = getProtocolInteractionSparkLend(
	'ETH_RPC_URL',
	'mainnet',
	'0xC13e21B648A5Ee794902342038FF3aDAB66BE987',
	'0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9',
	'SPARKLEND_INFO_SLACK_WEBHOOK_URL',
	5000000,
	'',
	createEtherscanTxLink
)

export const getProtocolInteractionSparkLendGnosis = getProtocolInteractionSparkLend(
	'GNOSIS_RPC_URL',
	'gnosis',
	'0x2Dae5307c5E3FD1CF5A72Cb6F698f915860607e0',
	'0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9',
	'SPARKLEND_INFO_GNOSIS_SLACK_WEBHOOK_URL',
	100000,
	'🦉 GNOSIS CHAIN 🦉',
	createGnosisscanTxLink
)
