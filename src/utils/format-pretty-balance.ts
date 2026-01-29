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

/****
 * import { formatUnits } from 'viem'
import { z } from 'zod'

const formatShape = z.object({
  balance: z.coerce.bigint(),
  decimals: z.coerce.number(),
  limitLength: z.number(),
})

export function formatPrettyBalance(
  balance?: string | bigint,
  decimals: number = 18,
  limitLength: number = 5
) {
  try {
    const valid = formatShape.parse({ balance, decimals, limitLength })

    const formatted = formatUnits(valid.balance, valid.decimals)

    console.log(formatted)

    return formatted

    try {
      // const balanceBigInt = BigInt(balance)
      // return decimals
      // ? limitDecimals(
      //   formatDisplay(formatUnits(balanceBigInt, decimals)),
      //   limitLength
      // )
      // : balance
    } catch (error) {
      console.error('Error formatting balance:', error)
      return '0'
    }
  } catch (e) {
    console.warn('unable to format balance', e)
  }
}

 */
