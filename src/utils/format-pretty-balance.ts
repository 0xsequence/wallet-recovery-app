import { formatUnits } from 'viem'

import { formatDisplay } from './format-display'
import { limitDecimals } from './limit-decimals'

export function formatPrettyBalance(
  balance: string | undefined,
  decimals?: number,
  limitLength: number = 5
) {
  if (!balance || typeof balance !== 'string') {
    return '0'
  }

  try {
    const balanceBigInt = BigInt(balance)
    return decimals
      ? limitDecimals(
        formatDisplay(formatUnits(balanceBigInt, decimals), {
          disableScientificNotation: true,
          maximumFractionDigits: limitLength
        }),
        limitLength
      )
      : balance
  } catch (error) {
    console.error('Error formatting balance:', error)
    return '0'
  }
}