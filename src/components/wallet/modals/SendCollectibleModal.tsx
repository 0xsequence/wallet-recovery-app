import { Modal } from '@0xsequence/design-system'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import SendCollectible from '~/components/wallet/collectibles/SendCollectible'

interface SendCollectibleModalProps {
  isOpen: boolean
  isDismissible: boolean
  collectibleInfo?: CollectibleInfo
  onClose: () => void
  onRecover: (amount?: string) => Promise<string | undefined | void>
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
  if (!isOpen) {return null}

  return (
    <Modal
      size="sm"
      isDismissible={isDismissible}
      onClose={onClose}
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
