import {
    ActionFn,
    Context,
    Event,
    TransactionEvent,
} from '@tenderly/actions'

import {
    Contract,
} from 'ethers'

import {
    ambBridgeExecutorAbi,
} from './abis'

import {
    createGnosisscanTxLink,
    createProvider,
    sendMessagesToSlack,
} from './utils'

const AMB_BRIDGE_EXECUTOR = '0xc4218c1127cb24a0d6c1e7d25dc34e10f2625f5a' as const

export const getGnosisExecutorOperations: ActionFn = async (context: Context, event: Event) => {
    const transactionEvent = event as TransactionEvent

	const provider = await createProvider(context, 'GNOSIS_RPC_URL')
    const bridgeExecutor = new Contract(AMB_BRIDGE_EXECUTOR, ambBridgeExecutorAbi, provider)

    const executorLogs = transactionEvent.logs
		.filter(log => log.address.toLowerCase() == AMB_BRIDGE_EXECUTOR.toLowerCase())
		.map(log => bridgeExecutor.interface.parseLog(log))

    const queueLogs = executorLogs.filter(log => log?.name == 'ActionsSetQueued')
    const executeLogs = executorLogs.filter(log => log?.name == 'ActionsSetExecuted')

    let messages: string[] = []

    for (const log of queueLogs) {
        messages.push(`\`\`\`
🏛️🦉 Queue called on Gnosis Executor 🏛️🦉

🪄 Spell${log?.args.targets.length > 1 ? 's:' : ': '}         ${log?.args.targets.join(', ')}
⏳ Execution time: ${new Date(Number(log?.args.executionTime)).toUTCString()}

${createGnosisscanTxLink(transactionEvent.hash)}\`\`\``)
    }

    for (const log of executeLogs) {
        const action = await bridgeExecutor.getActionsSetById(log?.args.id)
        messages.push(`\`\`\`
🏛️🦉 Execute called on Gnosis Executor 🏛️🦉

🪄 Spell${action.targets.length > 1 ? 's:' : ':'} ${action.targets.join(', ')}

${createGnosisscanTxLink(transactionEvent.hash)}\`\`\``)
    }

    await sendMessagesToSlack(messages, context, 'SPARKLEND_ALERTS_SLACK_WEBHOOK_URL')
}
