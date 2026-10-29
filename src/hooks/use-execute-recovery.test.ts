import { Extensions, Payload } from '@0xsequence/wallet-primitives'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { executeRecovery } from './use-execute-recovery'

const mocks = vi.hoisted(() => ({ find: vi.fn(), build: vi.fn() }))
vi.mock('./use-validate-signer', () => ({ findRecoverySigner: mocks.find }))
vi.mock('~/recovery-execute', () => ({ buildRecoveryExecuteTx: mocks.build }))

const wallet = '0x1111111111111111111111111111111111111111'
const signer = '0x2222222222222222222222222222222222222222'
const payload: Payload.Calls = { type: 'call', space: 1n, nonce: 0n, calls: [] }

beforeEach(() => {
  vi.resetAllMocks()
})
describe('execution checks the current signed recovery module', () => {
  it.each([
    Extensions.Rc3.recovery,
    Extensions.Rc4.recovery,
    Extensions.Rc5.recovery,
    Extensions.Rc6.recovery
  ])('preserves execution through the configured %s module', async recoveryModule => {
    const match = { extensionAddress: recoveryModule }
    mocks.find.mockResolvedValue(match)
    mocks.build.mockResolvedValue({ to: wallet, data: '0x1234' })
    const sendTx = vi.fn().mockResolvedValue({ id: 'fixture', hash: '0x1234' })
    await executeRecovery({
      walletAddress: wallet,
      recoverySignerAddress: signer,
      payload,
      chainId: 137,
      recoveryModule,
      sendTx
    })
    expect(mocks.build).toHaveBeenCalledWith(expect.objectContaining({ match, chainId: 137 }))
    expect(sendTx).toHaveBeenCalledWith(wallet, '0x1234', 137, undefined)
  })

  it('does not submit an old queue after an rc6 configuration migration', async () => {
    mocks.find.mockResolvedValue({ extensionAddress: Extensions.Rc6.recovery })
    const sendTx = vi.fn()
    await expect(
      executeRecovery({
        walletAddress: wallet,
        recoverySignerAddress: signer,
        payload,
        chainId: 137,
        recoveryModule: Extensions.Rc5.recovery,
        sendTx
      })
    ).rejects.toThrow('configuration changed')
    expect(mocks.build).not.toHaveBeenCalled()
    expect(sendTx).not.toHaveBeenCalled()
  })
})
