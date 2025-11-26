import { useEffect, useRef } from 'react'

import { TxHashTransaction, useTxHashesStore } from '~/hooks/use-tx-hash-store'
import { useWalletRecovery } from './wallet-recovery-context'

export function useAwaitReceipt(id?: string) {
  const txHashes = useTxHashesStore()
  const calls = useRef(0)
  const { values } = useWalletRecovery()
  const polling = useRef(false)
  const provider = values.provider

  const txHashesRef = useRef<TxHashTransaction[]>([])
  useEffect(() => {
    txHashesRef.current = txHashes.values
  }, [txHashes])

  if (!id || !provider || !txHashesRef.current) return

  const POLL_INTERVAL = 2000 // 2s

  async function poll(id: string) {
    const tx = txHashesRef.current?.find(tx => tx.id === id)

    if (!id || !provider || !tx) {
      setTimeout(poll.bind(null, id), POLL_INTERVAL) // keep polling
      return
    }

    if (calls.current > 20 && txHashes.status(id) !== 'timeout') {
      txHashes.update(id, { status: 'timeout' })
      return
    }

    if (['success', 'cancelled', 'error', 'timeout'].includes(tx.status!)) {
      return
    }

    calls.current = calls.current + 1

    try {
      if (!tx.hash) {
        setTimeout(poll.bind(null, id), POLL_INTERVAL) // keep polling
        return
      }

      const receipt = await provider.provider.request({
        method: 'eth_getTransactionReceipt',
        params: [tx.hash as `0x${string}`],
      })

      console.log(receipt)

      if (!receipt) {
        setTimeout(poll.bind(null, id), POLL_INTERVAL) // keep polling
        return
      }

      const status =
        receipt.status === '0x1'
          ? 'success'
          : receipt.status === '0x0'
            ? 'failed'
            : 'cancelled'
      txHashes.update(id, { hash: tx.hash, status, code: receipt.status })
    } catch (err) {
      txHashes.update(id, { status: 'cancelled' })
    }
  }

  if (!polling.current) {
    if (txHashesRef.current && provider && id) {
      polling.current = true

      poll(id)
    }
  }
}
