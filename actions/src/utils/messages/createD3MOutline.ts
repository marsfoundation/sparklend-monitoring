import { formatAssetAmount } from './formatAssetAmount'
import { AssetData } from '../types'

export const createD3MOutline = (daiData: AssetData): string => {
    return `💰 TOTAL DAI SUPPLY: ${formatAssetAmount(daiData, daiData.totalSupply)}
📝 TOTAL DAI DEBT:   ${formatAssetAmount(daiData, daiData.totalDebt)}`
}
