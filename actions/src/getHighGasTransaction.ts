import {
    ActionFn,
    Context,
    Event,
    TransactionEvent,
} from '@tenderly/actions'

import {
    createEtherscanTxLink,
    createMainnetProvider,
    formatBigInt,
    getDevianceInBasisPoints,
    sendMessagesToSlack,
    transactionAlreadyProcessed,
} from './utils'

export const HIGH_GAS_TRANSACTION_THRESHOLD = 2_500_000n as const
export const GAS_PRICE_DEVIANCE_THRESHOLD = 1000 as const

export const getHighGasTransaction: ActionFn = async (context: Context, event: Event) => {
	const transactionEvent = event as TransactionEvent

    const provider = await createMainnetProvider(context)

    const block = await provider.getBlock(transactionEvent.blockNumber)
    if (!block || !block.baseFeePerGas) return
    console.log({block})

    const deviance = getDevianceInBasisPoints(block.baseFeePerGas, BigInt(transactionEvent.gasPrice))

    if (await transactionAlreadyProcessed('getHighGasTransaction', context, transactionEvent)) return

    if (
        BigInt(transactionEvent.gasUsed) >= HIGH_GAS_TRANSACTION_THRESHOLD
        && deviance >= GAS_PRICE_DEVIANCE_THRESHOLD
    ) {
        await sendMessagesToSlack([`\`\`\`
🚨🔥 HIGH GAS TRANSACTION 🚨🔥

⛽️ Gas used: ${formatBigInt(transactionEvent.gasUsed, 0).slice(0, -2)}

${createEtherscanTxLink(transactionEvent.hash)}\`\`\``], context, 'SPARKLEND_HIGH_GAS_SLACK_WEBHOOK_URL')
    }
}
