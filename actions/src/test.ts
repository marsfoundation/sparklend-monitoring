// USE THIS FILE FOR LOCAL TESTING.
// RUN WITH `tsc src/test.ts --resolveJsonModule && node src/test.js` from `actions` directory.

// import * as dotenv from "dotenv"

// const axios = require('axios')

// import { abi as healthCheckerAbi } from '../jsons/SparkLendHealthChecker.json'

// const oracleAbi = require('../jsons/oracle-abi.json')

// const ethers = require('ethers')

// dotenv.config()

// const main = async() => {
	// const token = process.env.TENDERLY_ACCESS_KEY!
	// const pagerDuty = process.env.PAGERDUTY_ACCESS_KEY!

	// const HEALTH_CHECKER = "0xfda082e00EF89185d9DB7E5DcD8c5505070F5A3B"
	// const WHALE_ADDRESS = "0xf8dE75c7B95edB6f1E639751318f117663021Cf0"
	// const ORACLE = "0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9"
	// const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

	// // Log out all keys in ethers
	// console.log(Object.keys(ethers))

	// const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL!)

	// const healthChecker = new ethers.Contract(HEALTH_CHECKER, healthCheckerAbi, provider)
	// const oracle = new ethers.Contract(ORACLE, oracleAbi, provider)

	// const getUserHealthResponse = await healthChecker.getUserHealth(WHALE_ADDRESS)

	// console.log(getUserHealthResponse)

	// const response = await healthChecker.getReserveAssetLiability(WETH)

	// console.log(response)

	// const assets = response[0]
	// const liabilities = response[1]

	// const diff = BigInt(assets) - BigInt(liabilities)
	// const price = await oracle.getAssetPrice(WETH)

	// console.log({price})
	// const usdDiff = diff * BigInt(price) / BigInt(10 ** 18)

	// 	console.log({reserve: WETH, diff, price, usdDiff})

	// const getAllReservesAssetLiabilityResponse = await healthChecker.getAllReservesAssetLiability()

	// console.log(getAllReservesAssetLiabilityResponse)



	// // Define labels for each value
	// const labels = [
	// 	"Value 1",
	// 	"Value 2",
	// 	"Value 3",
	// 	"Value 4",
	// 	"Value 5",
	// 	"Value 6",
	// 	"Value 7",
	// 	"Value 8",
	// 	"Value 9",
	// 	"Value 10",
	// 	"Value 11",
	// 	"Value 12"
	// ]

	// // console.dir(Object.keys(ethers), {depth: null})

  	// // Combine labels and values into an array of objects
  	// const formattedData = rawOutput.map((value, index) => ({
	// 	label: labels[index],
	// 	value: BigInt(value).toString(),
  	// }))

  	// // console.log(formattedData)

	// const url = 'https://events.pagerduty.com/v2/enqueue'
	// const headers = {
	//   'Content-Type': 'application/json',
	// }
	// const data = {
	//   payload: {
	// 	summary: formattedData[0].value,
	// 	severity: 'critical',
	// 	source: 'Alert source',
	//   },
	//   routing_key: pagerDuty,
	//   event_action: 'trigger',
	// }

	// // const pagerDutyResponse = await axios.post(url, data, { headers })

	// // console.log(pagerDutyResponse.data)

	// const slackResponse = await axios.post(process.env.SLACK_WEBHOOK_URL!, { text: `value: ${formattedData[0].value}` })

	// console.log(slackResponse.data)
// }

// main()
