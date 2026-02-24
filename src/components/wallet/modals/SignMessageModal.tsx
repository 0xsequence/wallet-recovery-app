import { Modal, useMediaQuery } from '@0xsequence/design-system'
import { ConnectOptions, MessageToSign } from '@0xsequence/provider'
import SignClientTransactionConfirm from '~/components/signing/SignClientTransactionConfirm'

interface SignMessageModalProps {
  isOpen: boolean
  onClose: (details?: {
    message: MessageToSign
    chainId: number
    options?: ConnectOptions
  }) => void
}

export function SignMessageModal({ isOpen, onClose }: SignMessageModalProps) {
  const isMobile = useMediaQuery('isMobile')

  if (!isOpen) {
    return null
  }

  return (
    <Modal
      isDismissible={false}
      size="sm"
      contentProps={{
        style: { width: !isMobile ? '800px' : '100%' }
      }}
    >
      <SignClientTransactionConfirm onClose={onClose} />
    </Modal>
  )
}
