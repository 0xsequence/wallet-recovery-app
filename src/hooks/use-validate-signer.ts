import { Address } from 'viem'


import { manager } from '~/manager'

import { useWalletRecovery } from './wallet-recovery-context'
import compareAddress from '~/utils/compareAddress'

export function useValidateSigner() {
  const { set } = useWalletRecovery()

  return async function validateSigner(
    walletAddress: Address,
    recoverySignerAddress: Address,
    mnemonic: string
  ) {
    const signers = await manager.recovery.getSigners(walletAddress).then(signers => {
      if (!signers) {
        throw new Error('no_signers')
      }

      const walletSigner = signers.find(
        self =>
          self.kind === 'login-mnemonic' &&
          self.isRecovery &&
          compareAddress(self.address, recoverySignerAddress)
      )

      set.walletSigner(walletSigner)
      set.walletAddress(walletAddress)
      set.mnemonic(mnemonic)
    }).catch(error => {
      console.error("error", error)
      return undefined
    })

    return signers
  }
}
