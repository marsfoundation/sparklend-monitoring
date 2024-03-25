import { Context } from '@tenderly/actions'
import { createProvider } from './createProvider'

export const createMainnetProvider = async (context: Context) => {
	return createProvider(context, 'ETH_RPC_URL')
}
