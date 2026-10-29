import { Extensions, Payload } from '@0xsequence/wallet-primitives'
import { bytesToHex } from 'viem'
import { describe, expect, it } from 'vitest'

import { decodeQueuedPayloadInput } from './recovery-queue'

const wallet = '0x1111111111111111111111111111111111111111'
const signer = '0x2222222222222222222222222222222222222222'
const payload: Payload.Calls = {
  type: 'call',
  space: 123n,
  nonce: 0n,
  calls: [
    {
      to: wallet,
      value: 0n,
      data: '0x',
      gasLimit: 0n,
      delegateCall: false,
      onlyFallback: false,
      behaviorOnError: 'revert'
    }
  ]
}
const input = Extensions.Recovery.encodeCalldata(wallet, Payload.toRecovery(payload), signer, {
  type: 'hash',
  r: 1n,
  s: 2n,
  yParity: 0
})

describe('published recovery calldata compatibility', () => {
  it('round trips a real primitives-encoded recovery call', () => {
    // The signature uses the recovery domain, but Recovery.queuePayload stores
    // the ordinary wallet payload hash used by execution.
    const payloadHash = bytesToHex(Payload.hash(wallet, 137, payload))
    expect(decodeQueuedPayloadInput({ input, wallet, signer, payloadHash, chainId: 137 })).toEqual({
      ...payload,
      parentWallets: []
    })
  })

  it('rejects wrong wallet, signer, chain and hash instead of displaying unrelated calldata', () => {
    const payloadHash = bytesToHex(Payload.hash(wallet, 137, payload))
    const valid = { input, wallet, signer, payloadHash, chainId: 137 } as const
    expect(decodeQueuedPayloadInput({ ...valid, wallet: signer })).toBeUndefined()
    expect(decodeQueuedPayloadInput({ ...valid, signer: wallet })).toBeUndefined()
    expect(decodeQueuedPayloadInput({ ...valid, chainId: 1 })).toBeUndefined()
    expect(decodeQueuedPayloadInput({ ...valid, payloadHash: `0x${'00'.repeat(32)}` })).toBeUndefined()
    expect(decodeQueuedPayloadInput({ ...valid, input: '0x1234' })).toBeUndefined()
  })
})
