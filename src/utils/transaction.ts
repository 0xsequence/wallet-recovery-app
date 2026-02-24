import { Network } from '@0xsequence/wallet-primitives'

/**
 * Get explorer URL for a transaction hash
 */
export function getTransactionExplorerUrl(hash: string, chainId: number): string | undefined {
  const network = Network.getNetworkFromChainId(chainId)
  const blockExplorer = network?.blockExplorer
  if (!blockExplorer) {
    return undefined
  }
  return `${blockExplorer.url}tx/${hash}`
}

/**
 * Check if a transaction status is final (completed, succeeded, or failed)
 */
export function isTransactionFinal(status?: string): boolean {
  return status === 'pending' || status === 'success' || status === 'cancelled' || status === 'error'
}
