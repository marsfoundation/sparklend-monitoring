import {
	ActionFn,
	Context,
	Event,
	TransactionEvent,
} from '@tenderly/actions'

import {
	Contract,
	LogDescription,
} from 'ethers'

import {
	erc20Abi,
	poolAbi,
	poolConfiguratorAbi,
} from './abis'

import {
	createEtherscanTxLink,
	createMainnetProvider,
	formatBigInt,
	sendMessagesToSlack,
	transactionAlreadyProcessed,
} from './utils'

const reconfigurationEventNames = [
	'ReserveBorrowing',
	'ReserveFlashLoaning',
	'CollateralConfigurationChanged',
	'ReserveActive',
	'ReserveFrozen',
	'ReservePaused',
	'ReserveDropped',
	'ReserveFactorChanged',
	'LiquidationProtocolFeeChanged',
	'UnbackedMintCapChanged',
	'EModeAssetCategoryChanged',
	'EModeCategoryAdded',
	'ReserveInterestRateStrategyChanged',
	'ATokenUpgraded',
	'VariableDebtTokenUpgraded',
	'SiloedBorrowingChanged',
	'BridgeProtocolFeeUpdated',
	'FlashloanPremiumTotalUpdated',
	'FlashloanPremiumToProtocolUpdated',
	'BorrowableInIsolationChanged',
]

const SPARK_POOL_ADDRESS = '0xC13e21B648A5Ee794902342038FF3aDAB66BE987' as const
const AAVE_POOL_CONFIGURATOR_ADDRESS = '0x64b761D848206f447Fe2dd461b0c635Ec39EbB27' as const

export const getConfigurationChangeAave: ActionFn = async (context: Context, event: Event) => {
	const transactionEvent = event as TransactionEvent

	if (await transactionAlreadyProcessed('getConfigurationChangeAave', context, transactionEvent)) return

	const provider = await createMainnetProvider(context)

	const sparkPool = new Contract(SPARK_POOL_ADDRESS, poolAbi, provider)
	const aavePoolConfigurator = new Contract(AAVE_POOL_CONFIGURATOR_ADDRESS, poolConfiguratorAbi, provider)

	const sparkAssets = await sparkPool.getReservesList() as string[]
	const symbols: Record<string, string> = (await Promise.all(sparkAssets.map(async asset => await new Contract(asset, erc20Abi, provider).symbol())))
		.reduce((obj, symbol, index) => ({
			...obj,
			[sparkAssets[index]]: symbol,
		}), {})


	const reconfigurationEventMessages = transactionEvent.logs
		.map(log => aavePoolConfigurator.interface.parseLog(log))
		.filter(log => log && reconfigurationEventNames.includes(log.name))
		.filter(log => log && (sparkAssets.includes(log.args.asset) || log.args.asset == undefined))
		.map(log => log && formatConfigChangeMessage(log, symbols))
		.map(message => `\`\`\`${message}\n${createEtherscanTxLink(transactionEvent.hash)}\`\`\``)

	console.log(reconfigurationEventMessages)

	await sendMessagesToSlack(reconfigurationEventMessages, context, 'AAVE_ALERTS_SLACK_WEBHOOK_URL')
}

const formatConfigChangeMessage = (log: LogDescription, symbols: Record<string, string>) => {
	return`👻 ${log.name} 👻${Object.keys(log.args).map((_, index) => (formatArgOutput(log, index, symbols))).join('')}`
}

const formatArgOutput = (log: LogDescription, argIndex: number, symbols: Record<string, string>) => {
	return`\n${
		log.fragment.inputs[argIndex].name
}: ${
	log.fragment.inputs[argIndex].type.includes('uint')
		? formatBigInt(log.args[argIndex], 0).slice(0, -2)
		: log.fragment.inputs[argIndex].name === 'asset'
			? symbols[log.args[argIndex]]
			: log.args[argIndex]
}`
}
