import { Config, Constants, Context, Extensions, Payload, Signature } from '@0xsequence/wallet-primitives'
import { AbiFunction, Bytes } from 'ox'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildRecoveryExecuteTx } from './recovery-execute'

const mocks = vi.hoisted(() => ({ call: vi.fn(), updates: vi.fn(), config: vi.fn(), tree: vi.fn() }))
vi.mock('~/utils/rpcClient', () => ({ makeRpcClient: () => ({ call: mocks.call }) }))
vi.mock('~/networks', () => ({ networks: [{ chainId: 137, rpcUrl: 'http://fixture.invalid' }] }))
vi.mock('~/arweave-reader', () => ({
  arweaveReader: {
    getConfigurationUpdates: mocks.updates,
    getConfiguration: mocks.config,
    getTree: mocks.tree
  }
}))

const wallet = '0x1111111111111111111111111111111111111111'
const signer = '0x2222222222222222222222222222222222222222'
const leaf: Extensions.Recovery.RecoveryLeaf = {
  type: 'leaf',
  signer,
  requiredDeltaTime: 60n,
  minTimestamp: 0n
}
const imageHash = Extensions.Recovery.hashConfiguration(leaf)
const payload: Payload.Calls = { type: 'call', space: 1n, nonce: 0n, calls: [] }
function match(extensionAddress: `0x${string}`) {
  const walletConfig: Config.Config = {
    threshold: 1n,
    checkpoint: 0n,
    topology: { type: 'sapient-signer', address: extensionAddress, weight: 1n, imageHash }
  }
  return {
    leaf,
    extensionAddress,
    sapientImageHash: imageHash,
    deployImageHash: Bytes.toHex(Config.hashConfiguration(walletConfig)),
    walletConfig,
    deployContext: Context.Rc5,
    pendingUpdates: []
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.call.mockResolvedValue({ data: '0x' })
  mocks.updates.mockResolvedValue([])
  mocks.tree.mockResolvedValue(Extensions.Recovery.toGenericTree(leaf))
})

describe('actual published primitives execution encoding', () => {
  it.each([
    Extensions.Rc3.recovery,
    Extensions.Rc4.recovery,
    Extensions.Rc5.recovery,
    Extensions.Rc6.recovery
  ])('encodes a compact sapient signature for the signed %s configuration', async extension => {
    const state = match(extension)
    mocks.config.mockResolvedValue(state.walletConfig)
    const result = await buildRecoveryExecuteTx({
      walletAddress: wallet,
      recoverySignerAddress: signer,
      payload,
      chainId: 137,
      match: state
    })
    expect(result.to).toBe(wallet)
    const [encodedPayload, encodedSignature] = AbiFunction.decodeData(Constants.EXECUTE, result.data)
    expect(encodedPayload).toBe(Bytes.toHex(Payload.encode(payload)))
    const decoded = Signature.decodeSignature(Bytes.fromHex(encodedSignature))
    expect(decoded.configuration.topology).toMatchObject({
      signature: { address: extension.toLowerCase(), type: 'sapient_compact' }
    })
  })

  it('does not treat an RPC outage as an undeployed wallet', async () => {
    mocks.call.mockRejectedValue(new Error('fixture RPC unavailable'))
    await expect(
      buildRecoveryExecuteTx({
        walletAddress: wallet,
        recoverySignerAddress: signer,
        payload,
        chainId: 137,
        match: match(Extensions.Rc6.recovery)
      })
    ).rejects.toThrow('RPC unavailable')
  })

  it('rejects a module removed between signer lookup and execution encoding', async () => {
    mocks.config.mockResolvedValue(match(Extensions.Rc6.recovery).walletConfig)
    await expect(
      buildRecoveryExecuteTx({
        walletAddress: wallet,
        recoverySignerAddress: signer,
        payload,
        chainId: 137,
        match: match(Extensions.Rc5.recovery)
      })
    ).rejects.toThrow('configuration changed')
  })
})
