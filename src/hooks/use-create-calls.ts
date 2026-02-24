import { useState } from 'react'

import { TokenRecord } from '~/utils/types'
import { createTransactionRequest } from '~/utils/transactions'
import { useWalletRecovery } from './wallet-recovery-context'

import { useAwaitReceipt } from './use-await-receipt'
import { useObservable } from 'micro-observables'
import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'
import { Address } from 'viem'
import { AuthStore } from '~/stores/AuthStore'

export function useCreateCalls() {
  const { handle } = useWalletRecovery()
  const walletStore = useStore(WalletStore)
  const authStore = useStore(AuthStore)
  const accountAddress = useObservable(authStore.accountAddress)
  const [txnId, setTxnId] = useState<string>()
  useAwaitReceipt(txnId)
  const selectedExternalWalletAddress = useObservable(walletStore.selectedExternalWalletAddress)

  async function createCalls(items: TokenRecord[], chainId: number, customAmount?: string): Promise<string | undefined> {
    if (!selectedExternalWalletAddress) {
      throw new Error('No external wallet address selected')
    }

    if (!accountAddress) {
      throw new Error('No account address found')
    }

    const calls = items.map(item => {
      // Use custom amount if provided, otherwise use the full balance
      const amount = customAmount
        ? BigInt(customAmount)
        : BigInt(item.balance)

      const result = createTransactionRequest(
        item,
        accountAddress as Address,
        selectedExternalWalletAddress as Address,
        amount
      )

      return {
        ...result,
        gasLimit: 0n,
        delegateCall: false,
        onlyFallback: false,
        behaviorOnError: 'revert',
      }
    })

    if (calls.length) {
      const id = await handle.queuePayload(calls, chainId)
      setTxnId(id)
      return id
    }

    return undefined
  }

  return { createCalls, txnId }
}
