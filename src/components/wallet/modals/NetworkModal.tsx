import { Modal } from '@0xsequence/design-system'
import Networks from '~/components/network/Networks'
import { NetworkStore } from '~/stores/NetworkStore'
import { WalletStore } from '~/stores/WalletStore'

interface NetworkModalProps {
  isOpen: boolean
  onClose: () => void
  networkStore: NetworkStore
  walletStore: WalletStore
}

/**
 * Modal for managing network configurations
 */
export function NetworkModal({ isOpen, onClose, networkStore, walletStore }: NetworkModalProps) {
  if (!isOpen) return null

  const handleClose = () => {
    walletStore.isNetworkModalOpen.set(false)
    networkStore.discardUnsavedNetworkEdits()
    networkStore.isAddingNetwork.set(false)
    onClose()
  }

  return (
    <Modal
      onClose={handleClose}
      contentProps={{
        style: {
          scrollbarColor: 'gray black',
          scrollbarWidth: 'thin'
        }
      }}
    >
      <Networks />
    </Modal>
  )
}
