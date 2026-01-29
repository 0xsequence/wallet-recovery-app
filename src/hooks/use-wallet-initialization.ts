import { useEffect, useState } from 'react'
import { useStore, useObservable } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { TokenStore } from '~/stores/TokenStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { getMnemonic } from '~/utils/getMnemonic'

/**
 * Hook to handle wallet initialization tasks
 */
export function useWalletInitialization() {
  const authStore = useStore(AuthStore)
  const tokenStore = useStore(TokenStore)
  const networkStore = useStore(NetworkStore)

  const accountAddress = useObservable(authStore.accountAddress)
  const networks = useObservable(networkStore.networks)

  const [isV2Wallet, setIsV2Wallet] = useState<boolean | undefined>(undefined)

  // Load token balances when account and networks are ready
  useEffect(() => {
    if (accountAddress && networks.length > 0) {
      tokenStore.loadBalances(accountAddress, networks)
    }
  }, [accountAddress, networks, tokenStore])

  // Check if wallet is V2 or V3 based on mnemonic word count
  useEffect(() => {
    const checkMnemonic = async () => {
      try {
        const mnemonic = await getMnemonic({ authStore })
        if (mnemonic) {
          const wordCount = mnemonic.trim().split(/\s+/).length
          setIsV2Wallet(wordCount === 12)
        }
      } catch (e) {
        console.error('Failed to get mnemonic', e)
      }
    }
    checkMnemonic()
  }, [authStore])

  return {
    isV2Wallet
  }
}
