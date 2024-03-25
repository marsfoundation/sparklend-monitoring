import { Context } from '@tenderly/actions'

const axios = require('axios')

export const sendMessagesToPagerDuty = async (messages: Array<string>, context: Context) => {
	const deactivatePagerDuty = await context.secrets.get('DEACTIVATE_PAGERDUTY')

	if (deactivatePagerDuty === 'true') {
		console.log('PagerDuty deactivated')
		return
	}

	const pagerDutyRoutingKey = await context.secrets.get('PAGERDUTY_ROUTING_KEY')

	const headers = {
	  'Content-Type': 'application/json',
	}

	const data = {
	  payload: {
		summary: '',
		severity: 'critical',
		source: 'Alert source',
	  },
	  routing_key: pagerDutyRoutingKey,
	  event_action: 'trigger',
	}

	const pagerDutyResponses = await Promise.all(messages.map(async (message) => {
		data.payload.summary = message
		await axios.post('https://events.pagerduty.com/v2/enqueue', data, { headers })
	}))

	for (const pagerDutyResponse of pagerDutyResponses) {
		console.log(pagerDutyResponse)
	}
}
