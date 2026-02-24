import { Modal, useMediaQuery } from '@0xsequence/design-system'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import SendCollectible from '~/components/wallet/collectibles/SendCollectible'

interface SendCollectibleModalProps {
  isOpen: boolean
  isDismissible: boolean
  collectibleInfo?: CollectibleInfo
  onClose: () => void
  onRecover: (props: { amount?: string; to?: string }) => Promise<string | undefined | void>
  onDismissibleChange: (isDismissible: boolean) => void
}

export function SendCollectibleModal({
  isOpen,
  isDismissible,
  collectibleInfo,
  onClose,
  onRecover,
  onDismissibleChange
}: SendCollectibleModalProps) {
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
      <SendCollectible
        collectibleInfo={collectibleInfo}
        onClose={onClose}
        onRecover={onRecover}
        onDismissibleChange={onDismissibleChange}
      />
    </Modal>
  )
}
