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
} from './abis'

import {
	createEtherscanTxLink,
	createMainnetProvider,
	formatBigInt,
	sendMessagesToSlack,
	transactionAlreadyProcessed,
} from './utils'

const SPARK_POOL_ADDRESS = '0xC13e21B648A5Ee794902342038FF3aDAB66BE987' as const
const CAP_AUTOMATOR_ADDRESS = '0x2276f52afba7Cf2525fd0a050DF464AC8532d0ef' as const

export const getCapAutomatorUpdate: ActionFn = async (context: Context, event: Event) => {
	const transactionEvent = event as TransactionEvent

	if (await transactionAlreadyProcessed('getCapAutomatorUpdate', context, transactionEvent)) return

	const provider = await createMainnetProvider(context)

	const sparkPool = new Contract(SPARK_POOL_ADDRESS, poolAbi, provider)
	const capAutomator = new Contract(CAP_AUTOMATOR_ADDRESS, poolAbi, provider)

    const sparkAssets = await sparkPool.getReservesList() as string[]
	const symbols: Record<string, string> = (await Promise.all(sparkAssets.map(async asset => await new Contract(asset, erc20Abi, provider).symbol())))
		.reduce((obj, symbol, index) => ({
			...obj,
			[sparkAssets[index]]: symbol,
		}), {})

	const capUpdateEventMessages = transactionEvent.logs
		.filter(log => log.address.toLowerCase() == CAP_AUTOMATOR_ADDRESS.toLowerCase())
		.map(log => capAutomator.interface.parseLog(log))
		.filter(log => log && ['UpdateSupplyCap', 'UpdateBorrowCap'].includes(log.name))
		.map(log => log && formatAutomatedCapUpdateMessage(log, symbols))
		.map(message => `\`\`\`${message}\n${createEtherscanTxLink(transactionEvent.hash)}\`\`\``)

	console.log(capUpdateEventMessages)

	await sendMessagesToSlack(capUpdateEventMessages, context, 'SPARKLEND_INFO_SLACK_WEBHOOK_URL')
}

const formatAutomatedCapUpdateMessage = (log: LogDescription, symbols: Record<string, string>) => {
    let title = log.args[1] > log.args[2]
        ? `🏛️📉 ${symbols[log.args[0]]} ${log.name.slice(6, 12).toUpperCase()} CAP DECREASED 🏛️📉`
        : `🏛️📈 ${symbols[log.args[0]]} ${log.name.slice(6, 12).toUpperCase()} CAP INCREASED 🏛️📈`

    return `${title}\nOLD CAP: ${formatBigInt(log.args[1], 0).slice(0, -2)}\nNEW CAP: ${formatBigInt(log.args[2], 0).slice(0, -2)}`
}
