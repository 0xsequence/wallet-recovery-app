import { Sequence } from '@0xsequence/wallet-wdk'
import { Address } from 'ox'
import { useEffect, useState } from 'react'
import { manager } from '~/manager'

export function useFetchQueuedPayloads(walletAddress?: Address.Address) {
  const [value, setValue] = useState<Sequence.QueuedRecoveryPayload[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState()

  function refreshQueue(chainId?: number) {
    if (walletAddress) {
      setLoading(true)
      manager.recovery
        /* @ts-expect-error chainId not part of interface (but available) */
        .fetchQueuedPayloads(walletAddress, chainId)
        .then(payloads =>
          setValue(current => {
            const updated = current?.map(item => {
              const match = payloads.find(p => p.id === item.id)
              return match ? { ...item, ...match } : item
            })

            const newOnes = payloads.filter(
              p => !current.some(item => item.id === p.id)
            )
            return [...updated, ...newOnes]
          })
        )
        .catch(e => {
          setError(e)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  useEffect(() => {
    refreshQueue()
  }, [walletAddress])

  const data =
    value && value.length
      ? value.map(payload => {
          return { ...payload }
        })
      : value

  function getByChain(chainId: number) {
    if (data && !isLoading && !error) {
      return data.filter(payload => payload.chainId === chainId)
    }

    return
  }

  function refreshQueueByChainId(chainId?: number) {
    if (!chainId) return
    refreshQueue(chainId)
  }

  return {
    data,
    isLoading,
    getByChain,
    isError: !!error,
    error,
    refreshQueue,
    refreshQueueByChainId,
  }
}
