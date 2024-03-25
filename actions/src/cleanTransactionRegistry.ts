import {
	ActionFn,
	BlockEvent,
	Context,
	Event,
} from '@tenderly/actions'

export const cleanTransactionRegistry: ActionFn = async (context: Context, event: Event) => {
    const blockEvent = event as BlockEvent

    await removeStaleRecordsFromRegistry('getCapAutomatorUpdate', blockEvent, context)
    await removeStaleRecordsFromRegistry('getConfigurationChangeAave', blockEvent, context)
    await removeStaleRecordsFromRegistry('getHighGasTransaction', blockEvent, context)
    await removeStaleRecordsFromRegistry('getLiquidationSparkLend-mainnet', blockEvent, context)
    await removeStaleRecordsFromRegistry('getLiquidationSparkLend-gnosis', blockEvent, context)
    await removeStaleRecordsFromRegistry('getProtocolInteractionSparklend-mainnet', blockEvent, context)
    await removeStaleRecordsFromRegistry('getProtocolInteractionSparklend-gnosis', blockEvent, context)
}

const removeStaleRecordsFromRegistry = async (actionName: string, blockEvent: BlockEvent, context: Context) => {
    const registry = await context.storage.getJson(`${actionName}-tx-registry`)

    if(!registry) return

    await context.storage.putJson(`${actionName}-tx-registry`, Object.keys(registry as Record<string, number>).reduce((updatedRegistry, txHash) => {
        if (registry[txHash] + 100 > blockEvent.blockNumber) {
            updatedRegistry[txHash] = registry[txHash]
        } else {
            console.log(`Removing tx ${txHash} at ${registry[txHash]} from ${actionName}`)
        }
        return updatedRegistry
    }, {} as Record<string, number>))
}
