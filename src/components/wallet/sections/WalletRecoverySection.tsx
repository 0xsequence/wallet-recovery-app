import RecoveryQueue from '~/components/recovery/RecoveryQueue'
import type { QueuedRecoveryPayload } from '~/types/recovery'

interface WalletRecoverySectionProps {
  isV2Wallet: boolean | undefined
  queuedPayloads: QueuedRecoveryPayload[]
  isLoading: boolean
  refetch: () => void
}

export function WalletRecoverySection({
  isV2Wallet,
  queuedPayloads,
  isLoading,
  refetch
}: WalletRecoverySectionProps) {
  // Don't show recovery queue for V2 wallets
  if (isV2Wallet) {
    return null
  }

  return (
    <RecoveryQueue
      queuedPayloads={queuedPayloads}
      isLoading={isLoading}
      refetch={refetch}
    />
  )
}
