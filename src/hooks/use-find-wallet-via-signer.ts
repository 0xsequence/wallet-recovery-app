import { useCallback } from 'react'
import { mnemonicToAccount } from 'viem/accounts'

import { Address } from 'ox'

import { arweaveReader } from '~/arweave-reader'


export function useFindWalletViaSigner() {
  return useCallback(async function findWalletInfo(mnemonic: string) {
    try {

      if (!mnemonic) {
        throw new Error('invalid_mnemonic')
      }

      const recoverySigner = mnemonicToAccount(mnemonic)
      if (recoverySigner) {
        const records = await arweaveReader.getWallets(recoverySigner.address)
        const walletAddress = Object.keys(records)[0] as Address.Address

        if (!walletAddress || !recoverySigner.address) {
          throw new Error('invalid_mnemonic')
        }

        return {
          walletAddress,
          recoverySignerAddress: recoverySigner.address,
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'invalid_mnemonic') {
        throw new Error('invalid_mnemonic')
      }

      if (e instanceof Error) {
        throw new Error('empty')
      }

      throw new Error('invalid')
    }
  }, [])
}
