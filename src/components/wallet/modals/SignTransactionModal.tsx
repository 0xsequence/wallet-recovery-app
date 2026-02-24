import { Modal, useMediaQuery } from '@0xsequence/design-system'
import { ethers } from 'ethers'
import SignClientTransactionRelay from '~/components/signing/SignClientTransactionRelay'

interface SignTransactionModalProps {
  isOpen: boolean
  onCancel: () => void
  onSign: (details: {
    txn: ethers.Transaction[] | ethers.TransactionRequest[]
    chainId?: number
    origin?: string
    projectAccessKey?: string
  }) => Promise<void>
}

export function SignTransactionModal({ isOpen, onCancel, onSign }: SignTransactionModalProps) {
  const isMobile = useMediaQuery('isMobile')

  if (!isOpen) return null

  return (
    <Modal
      isDismissible={false}
      size="sm"
      contentProps={{
        style: { width: !isMobile ? '800px' : '100%' }
      }}
    >
      <SignClientTransactionRelay
        onClose={onCancel}
        handleSignTxn={onSign}
      />
    </Modal>
  )
}
