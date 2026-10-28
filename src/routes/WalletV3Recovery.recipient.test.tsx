import { ContractType, type TokenBalance } from '@0xsequence/indexer'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { decodeFunctionData, erc20Abi, erc721Abi, erc1155Abi } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import WalletV3Recovery from './WalletV3Recovery'
import { WalletAssetsSection } from '~/components/wallet/sections/WalletAssetsSection'
import { SendTokenModal } from '~/components/wallet/modals/SendTokenModal'
import { SendCollectibleModal } from '~/components/wallet/modals/SendCollectibleModal'

const fixture = vi.hoisted(() => {
  const observable = (value: unknown) => ({ get: () => value, set: vi.fn() })
  return {
    queue: vi.fn(),
    account: '0x1111111111111111111111111111111111111111',
    external: '0x2222222222222222222222222222222222222222',
    chosen: '0x3333333333333333333333333333333333333333',
    auth: { accountAddress: observable('0x1111111111111111111111111111111111111111'), isLoadingAccount: observable(false) },
    wallet: {
      selectedExternalProvider: observable({}),
      selectedExternalWalletAddress: observable('0x2222222222222222222222222222222222222222'),
      isSigningTxn: observable(false), isSigningMsg: observable(false), isNetworkModalOpen: observable(false),
      isSendingCollectibleTransaction: observable(undefined), isSendingTokenTransaction: observable(undefined)
    }
  }
})
vi.mock('~/stores/AuthStore', () => ({ AuthStore: class AuthStore {} }))
vi.mock('~/stores/WalletStore', () => ({ WalletStore: class WalletStore {} }))
vi.mock('~/stores/NetworkStore', () => ({ NetworkStore: class NetworkStore {} }))
vi.mock('~/stores', () => ({
  useStore: (type: { name: string }) => type.name === 'AuthStore' ? fixture.auth : fixture.wallet,
  useObservable: (value: { get: () => unknown }) => value.get()
}))
vi.mock('micro-observables', () => ({ useObservable: (value: { get: () => unknown }) => value.get() }))
vi.mock('~/hooks/wallet-recovery-context', () => ({ useWalletRecovery: () => ({ handle: { queuePayload: fixture.queue } }) }))
vi.mock('~/hooks/use-await-receipt', () => ({ useAwaitReceipt: vi.fn() }))
vi.mock('~/hooks/use-external-provider-sync', () => ({ useExternalProviderSync: vi.fn() }))
vi.mock('~/hooks/use-wallet-initialization', () => ({ useWalletInitialization: () => ({ isV2Wallet: false }) }))
vi.mock('~/hooks/use-transaction-signing', () => ({ useTransactionSigning: () => ({}) }))
vi.mock('~/hooks/use-queued-payloads', () => ({ useQueuedPayloads: () => ({ payloads: [], isLoading: false }) }))
vi.mock('~/components/header/RecoveryHeader', () => ({ default: () => null }))
vi.mock('~/components/wallet/modals/NetworkModal', () => ({ NetworkModal: () => null }))
vi.mock('~/components/wallet/modals/SignTransactionModal', () => ({ SignTransactionModal: () => null }))
vi.mock('~/components/wallet/modals/SignMessageModal', () => ({ SignMessageModal: () => null }))
vi.mock('~/components/wallet/modals/SendTokenModal', () => ({ SendTokenModal: () => null }))
vi.mock('~/components/wallet/modals/SendCollectibleModal', () => ({ SendCollectibleModal: () => null }))
vi.mock('~/components/wallet/sections/WalletConnectionsSection', () => ({ WalletConnectionsSection: () => null }))
vi.mock('~/components/wallet/sections/WalletAssetsSection', () => ({ WalletAssetsSection: () => null }))
vi.mock('~/components/wallet/sections/WalletRecoverySection', () => ({ WalletRecoverySection: () => null }))

beforeEach(() => { fixture.queue.mockReset().mockResolvedValue('queued') })

// Exercise the actual route's modal callback, token conversion, and call encoding.
// UI shells and external stores are isolated; the recipient path is not mocked.
describe('recovery form recipient reaches the queued transaction', () => {
  it.each([ContractType.ERC721, ContractType.ERC1155])('preserves a custom recipient for %s', async contractType => {
    const collectible = {
      collectibleInfoParams: { chainId: 42161, address: '0x4444444444444444444444444444444444444444', tokenId: '7', contractType },
      collectibleInfoResponse: { balance: '2', decimals: 0, name: 'Fixture' }
    }
    let tree!: ReactTestRenderer
    act(() => { tree = create(<WalletV3Recovery />) })
    act(() => { tree.root.findByType(WalletAssetsSection).props.onCollectibleSendClick(collectible) })
    await act(async () => {
      await tree.root.findByType(SendCollectibleModal).props.onRecover({ amount: '1', to: fixture.chosen })
    })
    const [calls] = fixture.queue.mock.calls[0]
    expect(calls[0].to).toBe(collectible.collectibleInfoParams.address)
    const decoded = decodeFunctionData({ abi: contractType === ContractType.ERC721 ? erc721Abi : erc1155Abi, data: calls[0].data })
    expect(decoded.args?.slice(0, 3)).toEqual([fixture.account, fixture.chosen, 7n])
    act(() => tree.unmount())
  })

  it.each([undefined, 'invalid-address'])('handles omitted or invalid recipients without redirecting an explicit value: %s', async recipient => {
    const token = { contractType: ContractType.NATIVE, contractAddress: '0x0000000000000000000000000000000000000000', accountAddress: fixture.account, chainId: 42161, balance: '1000000000000000000' } as TokenBalance
    let tree!: ReactTestRenderer
    act(() => { tree = create(<WalletV3Recovery />) })
    act(() => { tree.root.findByType(WalletAssetsSection).props.onTokenSendClick(token) })
    await act(async () => {
      const result = tree.root.findByType(SendTokenModal).props.onRecover({ amount: '1', to: recipient })
      if (recipient === undefined) {
        await result
        expect(fixture.queue.mock.calls[0][0][0].to).toBe(fixture.external)
      } else {
        await expect(result).rejects.toThrow('Invalid recovery recipient')
        expect(fixture.queue).not.toHaveBeenCalled()
      }
    })
    act(() => tree.unmount())
  })

  it.each([ContractType.NATIVE, ContractType.ERC20])('preserves a custom recipient for %s', async contractType => {
    const token = {
      contractType, contractAddress: '0x4444444444444444444444444444444444444444',
      accountAddress: fixture.account, chainId: 42161, balance: '2000000000000000000'
    } as TokenBalance
    let tree!: ReactTestRenderer
    act(() => { tree = create(<WalletV3Recovery />) })
    act(() => { tree.root.findByType(WalletAssetsSection).props.onTokenSendClick(token) })
    await act(async () => {
      await tree.root.findByType(SendTokenModal).props.onRecover({ amount: '1', to: fixture.chosen })
    })
    expect(fixture.queue).toHaveBeenCalledOnce()
    const [calls, chainId] = fixture.queue.mock.calls[0]
    expect(chainId).toBe(42161)
    expect(calls).toHaveLength(1)
    if (contractType === ContractType.NATIVE) {
      expect(calls[0]).toMatchObject({ to: fixture.chosen, value: 10n ** 18n, data: '0x' })
    } else {
      expect(calls[0].to).toBe(token.contractAddress)
      expect(decodeFunctionData({ abi: erc20Abi, data: calls[0].data })).toEqual({
        functionName: 'transfer', args: [fixture.chosen, 10n ** 18n]
      })
    }
    act(() => tree.unmount())
  })
})
