export const omitKey = <T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> => {
	const { [key]: omitted, ...rest } = obj
	return rest
}
