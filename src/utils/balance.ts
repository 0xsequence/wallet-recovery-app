import { ethers } from 'ethers'

/**
 * Format a token balance with proper decimals
 */
export function formatBalance(balance: string | bigint | number, decimals: number = 18): string {
  try {
    return ethers.formatUnits(balance, decimals)
  } catch (e) {
    console.error('Error formatting balance:', e)
    return '0'
  }
}

/**
 * Parse a token amount string to BigInt with proper decimals
 */
export function parseAmount(amount: string, decimals: number = 18): bigint {
  try {
    return ethers.parseUnits(amount, decimals)
  } catch (e) {
    throw new Error('Invalid amount format')
  }
}

/**
 * Check if user has sufficient balance for a transaction
 */
export function hasSufficientBalance(
  amount: string | undefined,
  balance: string | bigint | number,
  decimals: number = 18
): boolean {
  if (!amount) {
    return true
  }

  try {
    const amountBigInt = parseAmount(amount, decimals)
    return amountBigInt <= BigInt(balance)
  } catch (e) {
    // Invalid amount format
    return true // Don't show insufficient balance error for invalid input
  }
}
