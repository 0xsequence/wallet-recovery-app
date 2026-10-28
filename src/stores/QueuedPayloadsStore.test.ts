import { Extensions } from '@0xsequence/wallet-primitives'
import { observable } from 'micro-observables'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Store } from '.'
import { QueuedPayloadsStore } from './QueuedPayloadsStore'

const mocks = vi.hoisted(() => ({ find: vi.fn(), read: vi.fn(), decode: vi.fn() }))
vi.mock('~/hooks/use-validate-signer', () => ({ findRecoverySigner: mocks.find }))
vi.mock('~/utils/rpcClient', () => ({ makeRpcClient: () => ({ readContract: mocks.read }) }))
vi.mock('~/recovery-queue', () => ({ resolveQueuedPayloadsFromTransactionInputs: mocks.decode }))
vi.mock('~/networks', () => ({
  networks: [{ chainId: 137, type: 'mainnet', rpcUrl: 'http://fixture.invalid' }]
}))
vi.mock('./AuthStore', () => ({ AuthStore: class AuthStore {} }))

const wallet = '0x1111111111111111111111111111111111111111'
const signer = '0x2222222222222222222222222222222222222222'
const hash = `0x${'12'.repeat(32)}`
const match = (extension: string) => ({ extensionAddress: extension, leaf: { requiredDeltaTime: 60n } })
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

function setup() {
  const auth = {
    accountAddress: observable<string | undefined>(undefined),
    recoverySignerAddress: observable<string | undefined>(signer)
  }
  const store = new QueuedPayloadsStore({ get: () => auth } as unknown as Store)
  return { auth, store }
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.find.mockResolvedValue(match(Extensions.Rc6.recovery))
  mocks.read.mockImplementation(async ({ functionName }) => {
    if (functionName === 'totalQueuedPayloads') {
      return 1n
    }
    if (functionName === 'queuedPayloadHashes') {
      return hash
    }
    return 100n
  })
  mocks.decode.mockResolvedValue(new Map())
})

describe('recovery queue configuration ownership', () => {
  it.each([Extensions.Rc3.recovery, Extensions.Rc4.recovery, Extensions.Rc5.recovery])(
    'reads existing %s queues, then follows signed configuration to rc6',
    async extension => {
      const { auth, store } = setup()
      mocks.find.mockResolvedValueOnce(match(extension))
      auth.accountAddress.set(wallet)
      await flush()
      expect(store.payloads.get()[0].recoveryModule).toBe(extension)
      const oldId = store.payloads.get()[0].id
      store.refetch()
      expect(store.payloads.get()).toEqual([])
      await flush()
      expect(mocks.find).toHaveBeenCalledTimes(2)
      expect(store.payloads.get()).toHaveLength(1)
      expect(store.payloads.get()[0].recoveryModule).toBe(Extensions.Rc6.recovery)
      expect(store.payloads.get()[0].id).not.toBe(oldId)
    }
  )

  it('does not resurrect rows when logout races an RPC response', async () => {
    const { auth, store } = setup()
    let resolve!: (value: Map<string, never>) => void
    mocks.decode.mockReturnValueOnce(
      new Promise(done => {
        resolve = done
      })
    )
    auth.accountAddress.set(wallet)
    await flush()
    auth.accountAddress.set(undefined)
    resolve(new Map<string, never>())
    await flush()
    expect(store.payloads.get()).toEqual([])
    expect(store.isLoading.get()).toBe(false)
  })

  it('ignores an old wallet configuration response after switching wallets', async () => {
    const { auth, store } = setup()
    let resolve!: (value: ReturnType<typeof match>) => void
    mocks.find.mockReturnValueOnce(
      new Promise(done => {
        resolve = done
      })
    )
    auth.accountAddress.set(wallet)
    const second = '0x3333333333333333333333333333333333333333'
    auth.accountAddress.set(second)
    await flush()
    resolve(match(Extensions.Rc3.recovery))
    await flush()
    expect(store.payloads.get().map(row => row.wallet)).toEqual([second])
    expect(store.isLoading.get()).toBe(false)
  })

  it('discards pending results and unsubscribes when the store is destroyed', async () => {
    const { auth, store } = setup()
    let resolve!: (value: ReturnType<typeof match>) => void
    mocks.find.mockReturnValueOnce(
      new Promise(done => {
        resolve = done
      })
    )
    auth.accountAddress.set(wallet)
    store.destroyStore()
    resolve(match(Extensions.Rc6.recovery))
    await flush()
    auth.accountAddress.set('0x3333333333333333333333333333333333333333')
    await flush()
    expect(mocks.find).toHaveBeenCalledTimes(1)
    expect(store.payloads.get()).toEqual([])
    expect(store.isLoading.get()).toBe(false)
  })

  it('replaces a populated queue with a successful empty result', async () => {
    const { auth, store } = setup()
    auth.accountAddress.set(wallet)
    await flush()
    expect(store.payloads.get()).toHaveLength(1)
    mocks.read.mockResolvedValue(0n)
    store.refetch()
    await flush()
    expect(store.payloads.get()).toEqual([])
  })

  it('reports RPC failure instead of claiming a successfully empty queue', async () => {
    const { auth, store } = setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.read.mockRejectedValue(new Error('fixture RPC unavailable'))
    auth.accountAddress.set(wallet)
    await flush()
    expect(store.payloads.get()).toEqual([])
    expect(store.error.get()).toContain('could not be checked')
    expect(store.isLoading.get()).toBe(false)
    mocks.read.mockResolvedValue(0n)
    store.refetch()
    await flush()
    expect(store.error.get()).toBeUndefined()
    vi.restoreAllMocks()
  })
})
