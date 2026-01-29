import { atom, useAtom } from 'jotai'
type TxStatus =
  | 'idle'
  | 'preparing'
  | 'pending'
  | 'success'
  | 'cancelled'
  | 'failed'
  | 'unknown_chain'
  | 'error'
  | 'timeout'

export type TxHashTransaction = {
  id?: string
  hash?: `0x${string}`
  status?: TxStatus
  code?: string
  chainId?: number
}

const txHashesStore = atom<TxHashTransaction[]>([])

export function useTxHashesStore() {
  const [values, set] = useAtom(txHashesStore)

  function get(id: string | number) {
    return values.find(tx => tx.id === id || tx.chainId === id) || undefined
  }
  function add(id: string, chainId?: number) {
    set(current => {
      const next = [...current]
      const transaction: TxHashTransaction = {
        id,
        chainId,
        status: 'preparing',
      }

      next.push(transaction)
      return next
    })
  }

  function update(
    id: string,
    data: {
      hash?: `0x${string}` | undefined
      status?: TxStatus
      code?: string
      chainId?: number
    }
  ) {
    set(current => {
      const next = [...current]
      const index = next.findIndex(txn => txn.id === id)
      const value = next.find(txn => txn.id === id)

      next[index] = { ...value, ...data }
      return next
    })
  }

  function remove(id: string) {
    set(current => {
      const next = [...current]
      const index = next.findIndex(txn => txn.id === id)

      next.splice(index, 1)
      return next
    })
  }

  function status(id: string | number) {
    const hash = get(id)
    if (hash) {
      return hash.status
    }
    return undefined
  }

  return { values, set, get, status, add, update, remove }
}
