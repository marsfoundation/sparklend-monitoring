export const invertRecord = (record: Record<string, string>): Record<string, string> => {
	const invertedRecord: Record<string, string> = {}

	for (const [key, value] of Object.entries(record)) {
		invertedRecord[value] = key
	}

	return invertedRecord
}
