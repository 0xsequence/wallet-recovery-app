import { Address } from 'viem'


import { manager } from '~/manager'

import { useWalletRecovery } from './wallet-recovery-context'
import compareAddress from '~/utils/compareAddress'

export async function findRecoverySigner(
  walletAddress: Address,
  recoverySignerAddress: Address
) {
  const signers = await manager.recovery.getSigners(walletAddress)
  if (!signers || signers.length === 0) {
    throw new Error('no_signers')
  }

  const walletSigner = signers.find(
    self =>
      self.kind === 'login-mnemonic' &&
      self.isRecovery &&
      compareAddress(self.address, recoverySignerAddress)
  )

  if (!walletSigner) {
    throw new Error('signer_not_found')
  }

  return walletSigner
}

export function useValidateSigner() {
  const { set } = useWalletRecovery()

  return async function validateSigner(
    walletAddress: Address,
    recoverySignerAddress: Address
  ) {
    const walletSigner = await findRecoverySigner(walletAddress, recoverySignerAddress)

    set.walletSigner(walletSigner)
    set.walletAddress(walletAddress)

    return walletSigner
  }
}
