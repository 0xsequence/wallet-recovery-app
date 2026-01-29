import { Modal } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import SendToken from '~/components/wallet/tokens/SendToken'

interface SendTokenModalProps {
  isOpen: boolean
  isDismissible: boolean
  tokenBalance?: TokenBalance
  onClose: () => void
  onRecover: (to?: string, amount?: string) => Promise<string | undefined | void>
  onDismissibleChange: (isDismissible: boolean) => void
}

export function SendTokenModal({
  isOpen,
  isDismissible,
  tokenBalance,
  onClose,
  onRecover,
  onDismissibleChange
}: SendTokenModalProps) {
  if (!isOpen) return null

  return (
    <Modal
      size="sm"
      isDismissible={isDismissible}
      onClose={onClose}
    >
      <SendToken
        tokenBalance={tokenBalance}
        onClose={onClose}
        onRecover={onRecover}
        onDismissibleChange={onDismissibleChange}
      />
    </Modal>
  )
}
