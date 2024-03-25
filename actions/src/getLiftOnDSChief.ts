import {
    ActionFn,
    Context,
    Event,
    TransactionEvent,
} from '@tenderly/actions'

import { Contract } from 'ethers'

import { dsChiefAbi } from './abis'

import { createEtherscanTxLink, createMainnetProvider, sendMessagesToSlack } from './utils'

const DS_CHIEF = '0x0a3f6849f78076aefadf113f5bed87720274ddc0' as const

export const getLiftOnDSChief: ActionFn = async (context: Context, event: Event) => {
    const transactionEvent = event as TransactionEvent

    const provider = await createMainnetProvider(context)
    const chief = new Contract(DS_CHIEF, dsChiefAbi, provider)

    const hat = await chief.hat()

    await sendMessagesToSlack([`\`\`\`
🏛️🏋️ Lift called on DS Chief 🏛️🏋️

🎩 Current hat: ${hat}

${createEtherscanTxLink(transactionEvent.hash)}\`\`\``], context, 'SPARKLEND_ALERTS_SLACK_WEBHOOK_URL')
}
