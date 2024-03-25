import {
	Context,
	TransactionEvent,
} from '@tenderly/actions'

export const transactionAlreadyProcessed = async (actionName: string, context: Context, txEvent: TransactionEvent): Promise<boolean> => {
    const processedTransactionsRegistry = await context.storage.getJson(`${actionName}-tx-registry`) || {}

    if (processedTransactionsRegistry[txEvent.hash]) {
        console.log(`Transaction ${txEvent.hash} was already processed by action ${actionName}`)
        return true
    }

    console.log(`Transaction ${txEvent.hash} is being saved as processed by action ${actionName}`)
    await context.storage.putJson(`${actionName}-tx-registry`, {
        ...processedTransactionsRegistry,
        [txEvent.hash]: txEvent.blockNumber,
    })

    return false
}
