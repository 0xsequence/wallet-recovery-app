import { useEffect } from 'react'
import { useTxHashesStore } from './use-tx-hash-store'

/**
 * Hook to manage modal dismissibility based on transaction and waiting state
 */
export function useModalDismissibility(
  recoveryPayloadId: string | undefined,
  isWaitingForSignature: boolean,
  onDismissibleChange?: (isDismissible: boolean) => void
) {
  const txHashes = useTxHashesStore()

  useEffect(() => {
    if (!onDismissibleChange) {
      return
    }

    const transaction = recoveryPayloadId ? txHashes.get(recoveryPayloadId) : undefined
    const txStatus = transaction?.status
    const hasFinalStatus =
      txStatus === 'pending' ||
      txStatus === 'success' ||
      txStatus === 'cancelled' ||
      txStatus === 'error'

    // Modal should be non-dismissible when waiting for signature or when we have a recoveryPayloadId without final status
    const shouldBeDismissible = !isWaitingForSignature && (!recoveryPayloadId || hasFinalStatus)
    onDismissibleChange(shouldBeDismissible)
  }, [isWaitingForSignature, recoveryPayloadId, onDismissibleChange, txHashes.values])
}
