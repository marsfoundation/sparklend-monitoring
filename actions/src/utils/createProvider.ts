import { Context } from '@tenderly/actions'
import { JsonRpcProvider } from 'ethers'

export const createProvider = async (context: Context, rpcUrlSecret: string) => {
	const rpcUrl = await context.secrets.get(rpcUrlSecret)
	return new JsonRpcProvider(rpcUrl)
}
