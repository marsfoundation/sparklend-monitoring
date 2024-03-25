import { LogDescription } from 'ethers'

export const getUsersFromParsedLogs = (logs: LogDescription[]): string[] => {
    return [...new Set(
        logs.map(log => log.args.user).filter(user => user !== undefined))
    ]
}
