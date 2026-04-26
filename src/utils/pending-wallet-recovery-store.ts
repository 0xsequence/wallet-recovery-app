import compareAddress from '~/utils/compareAddress'
import { useAtom } from 'jotai'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'
import { Address } from 'viem'
import type { QueuedRecoveryPayload } from '~/types/recovery'


const STORAGE_KEY = 'walletRecovery'

type PendingWalletRecoveryStoreProps = {
  isIgnored: string[]
  payloads: QueuedRecoveryPayload[]
}

const initialState = {
  isIgnored: [],
  payloads: [],
}

function replacer(_key: string, value: unknown) {
  if (typeof value === 'bigint') {
    // encode bigint as string with marker
    return { __type: 'bigint', value: value.toString() }
  }
  return value
}

function reviver(_key: string, value: unknown) {
  if (isEncodedBigInt(value)) {
    // restore bigint
    return BigInt(value.value)
  }
  return value
}

function isEncodedBigInt(value: unknown): value is { __type: 'bigint'; value: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__type' in value &&
    'value' in value &&
    value.__type === 'bigint' &&
    typeof value.value === 'string'
  )
}

const storage = createJSONStorage<PendingWalletRecoveryStoreProps>(
  () => localStorage,
  {
    reviver,
    replacer,
  }
)

// Example: using localStorage (sync)

const pendingWalletRecoveryStore =
  atomWithStorage<PendingWalletRecoveryStoreProps>(
    STORAGE_KEY,
    structuredClone(initialState),
    storage,
    {
      getOnInit: true,
    }
  )

export function usePendingWalletRecoveryStore() {
  const [values, set] = useAtom(pendingWalletRecoveryStore)

  function ignoreIds(ids: string[]) {
    set(current => {
      const next = structuredClone(current)
      next.isIgnored = [...next.isIgnored, ...ids]
      return next
    })
  }

  function addPayloads(payloads: QueuedRecoveryPayload[]) {
    set(current => {
      const next = structuredClone(current)

      const merged = [...next.payloads, ...payloads]
      const unique = [...new Map(merged.map(item => [item.id, item])).values()]
      next.payloads = unique
      return next
    })
  }

  function forAddress(address: Address) {
    const payloads = values.payloads.filter(payload =>
      compareAddress(payload.wallet, address)
    )

    const hasPayloads = payloads && payloads.length

    return {
      hasPayloads,
      payloads,
    }
  }

  function signers(walletAddress?: Address) {
    const seen = new Set()

    const payloads = walletAddress
      ? values.payloads.filter(payload =>
        compareAddress(payload.wallet, walletAddress)
      )
      : values.payloads

    const unique = payloads.filter(obj => {
      if (seen.has(obj.signer)) {
        return false // already included
      }
      seen.add(obj.signer)
      return true
    })
    return unique.map(payload => ({
      signer: payload.signer,
      address: payload.wallet,
    }))
  }

  const reset = Object.assign(
    () => {
      set(structuredClone(initialState))
    },
    {
      ignored() {
        set(current => {
          const next = structuredClone(current)
          next.isIgnored = []
          return next
        })
      },
    }
  )

  return { values, set, reset, ignoreIds, addPayloads, forAddress, signers }
}
