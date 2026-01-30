import { useEffect } from 'react'
import { useTxHashesStore, TxHashTransaction } from './use-tx-hash-store'

export type TransactionStatus = {
  transaction?: TxHashTransaction
  isSigned: boolean
  isRejected: boolean
  isFinal: boolean
}

/**
 * Hook to monitor transaction status with polling
 */
export function useTransactionStatus(
  recoveryPayloadId: string | undefined,
  isWaitingForSignature: boolean,
  onStatusChange?: (isWaiting: boolean) => void
): TransactionStatus {
  const txHashes = useTxHashesStore()
  const transaction = recoveryPayloadId ? txHashes.get(recoveryPayloadId) : undefined
  const txStatus = transaction?.status

  const isSigned = txStatus === 'pending' || txStatus === 'success'
  const isRejected = txStatus === 'cancelled' || txStatus === 'error'
  const isFinal = isSigned || isRejected

  // Monitor transaction status changes
  useEffect(() => {
    if (!recoveryPayloadId) {
      return
    }

    const transaction = txHashes.get(recoveryPayloadId)
    const status = transaction?.status

    // Update waiting state if we have a definitive status
    if (status === 'pending' || status === 'success') {
      onStatusChange?.(false)
    } else if (status === 'cancelled' || status === 'error') {
      onStatusChange?.(false)
    }
  }, [recoveryPayloadId, txHashes.values, onStatusChange])

  // Poll for transaction status updates
  useEffect(() => {
    if (!recoveryPayloadId || !isWaitingForSignature) {
      return
    }

    const interval = setInterval(() => {
      const transaction = txHashes.get(recoveryPayloadId)
      const status = transaction?.status

      if (status === 'pending' || status === 'success' || status === 'cancelled' || status === 'error') {
        onStatusChange?.(false)
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [recoveryPayloadId, isWaitingForSignature, txHashes, onStatusChange])

  return {
    transaction,
    isSigned,
    isRejected,
    isFinal
  }
}
