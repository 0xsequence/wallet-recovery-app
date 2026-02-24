import { Modal, useMediaQuery } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import SendToken from '~/components/wallet/tokens/SendToken'

interface SendTokenModalProps {
  isOpen: boolean
  isDismissible: boolean
  tokenBalance?: TokenBalance
  onClose: () => void
  onRecover: (props: { amount?: string; to?: string }) => Promise<string | undefined | void>
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
  const isMobile = useMediaQuery('isMobile')
  if (!isOpen) return null

  return (
    <Modal
      size="sm"
      isDismissible={isDismissible}
      onClose={onClose}
      contentProps={{
        style: {
          width: isMobile ? '100%' : 'auto',
          maxWidth: '100%',
          minWidth: 0,
          maxHeight: isMobile ? '100%' : '90vh',
          overflow: 'auto'
        }
      }}
      rootProps={{ className: 'px-3 sm:px-0' }}
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
