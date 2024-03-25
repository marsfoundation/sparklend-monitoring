import {
	Context,
	Event,
	TransactionEvent,
} from '@tenderly/actions'

import {
	poolAbi,
	sparklendHealthCheckerAbi,
} from './abis'

import {
	formatBigInt,
	sendMessagesToPagerDuty,
	sendMessagesToSlack,
} from './utils'

const ethers = require('ethers')

const SPARKLEND_POOL = '0xC13e21B648A5Ee794902342038FF3aDAB66BE987'
const SPARKLEND_HEALTH_CHECKER = '0xfda082e00EF89185d9DB7E5DcD8c5505070F5A3B'

const AAVE_POOL = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'
const AAVE_HEALTH_CHECKER = '0xB75927FbB797d4f568FF782d2B21911015dd52f3'

const getUserInfo = (
	poolAddress: string,
	healthCheckerAddress: string,
	slackWebhookUrl: string,
	usePagerDuty: boolean,
) => async (context: Context, event: Event) => {
	let txEvent = event as TransactionEvent

	// 1. Define contracts


	const pool = new ethers.Contract(poolAddress, poolAbi)

	// 2. Filter events logs to get all pool logs

	const filteredLogs = txEvent.logs.filter(log => {
		if (log.address !== poolAddress) return

		try {
			return pool.interface.parseLog(log)
		} catch (e) {
			// console.log(e)
		}
	})

	// 3. Get all `user` properties from logs, from all events that users adjust positions

	let users: Array<string> = []

	filteredLogs.forEach(log => {
		const parsedLog = pool.interface.parseLog(log).args
		const userRelatedEventArgs = [
			'user',
			'onBehalfOf',
			'target',
			'initiator',
			'liquidator',
			'repayer',
			'to',
		]
		for (const userType of userRelatedEventArgs) {
			if (parsedLog[userType]) {
				console.log(`Checking heath for ${parsedLog[userType]} (${userType})`)
				users.push(parsedLog[userType])
			}
		}
	})

	console.log(`Checking heath for ${txEvent.from} (tx.from)`)
	users.push(txEvent.from)

	users = [...new Set(users)]  // Remove duplicates
	console.log(`Final list of addresses to perform the check on:
${users.join('\n')}`)

	// 4. Get health of all users

	const url = await context.secrets.get('ETH_RPC_URL')

	const provider = new ethers.JsonRpcProvider(url)

	const healthChecker = new ethers.Contract(healthCheckerAddress, sparklendHealthCheckerAbi, provider)

	const userHealths = await Promise.all(users.map(async (user) => {
		return {
			user,
			...await healthChecker.getUserHealth(user)
		}
	}))

	console.log({userHealths})

	// 5. Filter userHealths to only users below liquidation threshold, exit if none

	const usersBelowLT = userHealths.filter(userHealth => {
		// return userHealth.healthFactor < 2e18  // TESTING
		return userHealth.belowLiquidationThreshold
		// return true  // UNCOMMENT AND REPLACE FOR TESTING
	})

	if (usersBelowLT.length === 0) {
		console.log('No users below liquidation threshold')
		return
	}

	// 6. Generate messages for each user below liquidation threshold and send to Slack and PagerDuty

	const messages = usersBelowLT.map(userHealth => {
		return formatUserHealthAlertMessage(userHealth, txEvent)
	})

	if (messages.length === 0) return

	await sendMessagesToSlack(messages, context, slackWebhookUrl)

	if (usePagerDuty) {
		await sendMessagesToPagerDuty(messages, context)
	}
}

const formatUserHealthAlertMessage = (userHealth: any, txEvent: TransactionEvent) => {
	return `
\`\`\`
🚨🚨🚨 USER BELOW LIQUIDATION THRESHOLD ALERT 🚨🚨🚨

Account ${userHealth.user} is BELOW liquidation threshold after protocol interaction.
This indicates possible malicious activity.

Transaction hash: ${txEvent.hash}

RAW DATA:

Total Collateral: ${BigInt(userHealth.totalCollateralBase).toString()}
Total Debt:       ${BigInt(userHealth.totalDebtBase).toString()}
LT:               ${BigInt(userHealth.currentLiquidationThreshold).toString()}
LTV:              ${BigInt(userHealth.ltv).toString()}
Health Factor:    ${BigInt(userHealth.healthFactor).toString()}

FORMATTED DATA:

Total Collateral: ${formatBigInt(BigInt(userHealth.totalCollateralBase), 8)}
Total Debt:       ${formatBigInt(BigInt(userHealth.totalDebtBase), 8)}
LT:               ${formatBigInt(BigInt(userHealth.currentLiquidationThreshold), 2)}%
LTV:              ${formatBigInt(BigInt(userHealth.ltv), 2)}%
Health Factor:    ${formatBigInt(BigInt(userHealth.healthFactor), 18)}\`\`\``
}

export const getUserInfoSparkLend = getUserInfo(
	SPARKLEND_POOL,
	SPARKLEND_HEALTH_CHECKER,
	'SPARKLEND_ALERTS_SLACK_WEBHOOK_URL',
	true,
)

export const getUserInfoAave = getUserInfo(
	AAVE_POOL,
	AAVE_HEALTH_CHECKER,
	'AAVE_ALERTS_SLACK_WEBHOOK_URL',
	false,
	)
