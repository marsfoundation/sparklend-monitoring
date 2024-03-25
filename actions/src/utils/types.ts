export type AssetData = {
	price: bigint,
	decimals: bigint,
	symbol: string
	totalSupply: bigint,
	usersCollateral: {
		balance: bigint,
		value: bigint,
	},
	totalDebt: bigint,
	usersDebt: {
		balance: bigint,
		value: bigint,
	},
}

export type AssetsData = {
	[K in keyof any as Exclude<K, 'user'>]: AssetData
} & {
	user: string;
}
