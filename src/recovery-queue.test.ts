import { Extensions, Payload } from '@0xsequence/wallet-primitives'
import { AbiFunction } from 'ox'
import { describe, expect, it } from 'vitest'
import { bytesToHex } from 'viem'
import type { Address, Hex, PublicClient } from 'viem'

import { resolveQueuedPayloadsFromTransactionInputs } from './recovery-queue'

type QueuePayloadFixture = {
  wallet: Address
  signer: Address
  extension: Address
  recipient: Address
  chainId: number
  payload: Payload.Calls
  payloadHash: Hex
  input: Hex
  txHash: Hex
}

describe('resolveQueuedPayloadsFromTransactionInputs', () => {
  it('decodes queued payloads from transaction input when the queue log does not expose the payload hash in data', async () => {
    const { wallet, signer, extension, recipient, chainId, payload, payloadHash, input, txHash } =
      createQueuePayloadFixture()
    const client = {
      request: async () => [
        {
          data: '0x' as Hex,
          transactionHash: txHash,
          logIndex: '0x1' as Hex,
        },
      ],
      getBlockNumber: async () => 1_000n,
      getBlock: async ({ blockNumber }: { blockNumber: bigint }) => ({ timestamp: blockNumber }),
      getTransaction: async () => ({ input }),
    } as unknown as PublicClient

    const resolvedPayloads = await resolveQueuedPayloadsFromTransactionInputs({
      client,
      extension,
      wallet,
      signer,
      chainId,
      payloads: [{ payloadHash, queuedAt: 100n }],
    })

    const resolvedPayload = resolvedPayloads.get(payloadHash.toLowerCase())
    expect(resolvedPayload?.space).toBe(payload.space)
    expect(resolvedPayload?.nonce).toBe(payload.nonce)
    expect(resolvedPayload?.calls[0]?.to).toBe(recipient)
    expect(resolvedPayload?.calls[0]?.value).toBe(123n)
  })

  it('falls back to the queued timestamp window when the wallet and signer topic query returns no logs', async () => {
    const { wallet, signer, extension, recipient, chainId, payload, payloadHash, input, txHash } =
      createQueuePayloadFixture()
    const client = {
      request: async ({ params }: { params: [{ topics?: (Hex | null)[] }] }) => {
        const [{ topics }] = params
        if (topics) {
          return []
        }

        return [
          {
            data: '0x' as Hex,
            transactionHash: txHash,
            logIndex: '0x1' as Hex,
          },
        ]
      },
      getBlockNumber: async () => 1_000n,
      getBlock: async ({ blockNumber }: { blockNumber: bigint }) => ({ timestamp: blockNumber }),
      getTransaction: async () => ({ input }),
    } as unknown as PublicClient

    const resolvedPayloads = await resolveQueuedPayloadsFromTransactionInputs({
      client,
      extension,
      wallet,
      signer,
      chainId,
      payloads: [{ payloadHash, queuedAt: 100n }],
    })

    const resolvedPayload = resolvedPayloads.get(payloadHash.toLowerCase())
    expect(resolvedPayload?.space).toBe(payload.space)
    expect(resolvedPayload?.nonce).toBe(payload.nonce)
    expect(resolvedPayload?.calls[0]?.to).toBe(recipient)
    expect(resolvedPayload?.calls[0]?.value).toBe(123n)
  })

  it('uses per-payload windows so spread queuedAt timestamps do not scan the whole gap between them', async () => {
    const { wallet, signer, extension, chainId, payloadHash, input, txHash } =
      createQueuePayloadFixture()
    const otherPayloadHash = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' as Hex
    const getLogsRanges: Array<{ fromBlock: bigint; toBlock: bigint }> = []
    const client = {
      request: async ({ params }: { params: [{ fromBlock: Hex; toBlock: Hex }] }) => {
        const [{ fromBlock, toBlock }] = params
        getLogsRanges.push({ fromBlock: BigInt(fromBlock), toBlock: BigInt(toBlock) })
        return [{ data: '0x' as Hex, transactionHash: txHash, logIndex: '0x1' as Hex }]
      },
      getBlockNumber: async () => 200_000n,
      getBlock: async ({ blockNumber }: { blockNumber: bigint }) => ({ timestamp: blockNumber }),
      getTransaction: async () => ({ input }),
    } as unknown as PublicClient

    await resolveQueuedPayloadsFromTransactionInputs({
      client,
      extension,
      wallet,
      signer,
      chainId,
      payloads: [
        { payloadHash, queuedAt: 100n },
        { payloadHash: otherPayloadHash, queuedAt: 100_000n },
      ],
    })

    expect(getLogsRanges.length).toBeGreaterThan(0)
    const totalBlocksScanned = getLogsRanges.reduce(
      (sum, range) => sum + (range.toBlock - range.fromBlock + 1n),
      0n,
    )

    expect(totalBlocksScanned).toBeLessThan(10_000n)

    const sortedRanges = [...getLogsRanges].sort((a, b) =>
      a.fromBlock < b.fromBlock ? -1 : a.fromBlock > b.fromBlock ? 1 : 0,
    )
    const hasGap = sortedRanges.some((range, index) =>
      index > 0 && range.fromBlock > sortedRanges[index - 1].toBlock + 1n,
    )
    expect(hasGap).toBe(true)
  })

  it('resolves an old payload when recent block time drifts from the historical rate', async () => {
    const { wallet, signer, extension, recipient, chainId, payloadHash, input, txHash } =
      createQueuePayloadFixture()

    const latestNumber = 1_000_000n
    const queueBlock = 100_000n
    // Recent 5k blocks run at 2s/block, history at 1s/block — a linear extrapolation
    // from the recent sample mispredicts an old target by hundreds of thousands of blocks.
    const timestampAt = (block: bigint): bigint =>
      block <= 995_000n ? block : 995_000n + (block - 995_000n) * 2n

    const client = {
      request: async ({ params }: { params: [{ fromBlock: Hex; toBlock: Hex }] }) => {
        const [{ fromBlock, toBlock }] = params
        const from = BigInt(fromBlock)
        const to = BigInt(toBlock)
        if (from <= queueBlock && queueBlock <= to) {
          return [{ data: '0x' as Hex, transactionHash: txHash, logIndex: '0x1' as Hex }]
        }
        return []
      },
      getBlockNumber: async () => latestNumber,
      getBlock: async ({ blockNumber }: { blockNumber: bigint }) => ({ timestamp: timestampAt(blockNumber) }),
      getTransaction: async () => ({ input }),
    } as unknown as PublicClient

    const resolvedPayloads = await resolveQueuedPayloadsFromTransactionInputs({
      client,
      extension,
      wallet,
      signer,
      chainId,
      payloads: [{ payloadHash, queuedAt: queueBlock }],
    })

    const resolvedPayload = resolvedPayloads.get(payloadHash.toLowerCase())
    expect(resolvedPayload?.calls[0]?.to).toBe(recipient)
    expect(resolvedPayload?.calls[0]?.value).toBe(123n)
  })

  it('keeps searching the timestamp window when topic-filtered logs do not contain the queue transaction', async () => {
    const { wallet, signer, extension, recipient, chainId, payload, payloadHash, input, txHash } =
      createQueuePayloadFixture()
    const unrelatedTxHash = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Hex
    const client = {
      request: async ({ params }: { params: [{ topics?: (Hex | null)[] }] }) => {
        const [{ topics }] = params
        if (topics) {
          return [
            {
              data: '0x' as Hex,
              transactionHash: unrelatedTxHash,
              logIndex: '0x1' as Hex,
            },
          ]
        }

        return [
          {
            data: '0x' as Hex,
            transactionHash: txHash,
            logIndex: '0x2' as Hex,
          },
        ]
      },
      getBlockNumber: async () => 1_000n,
      getBlock: async ({ blockNumber }: { blockNumber: bigint }) => ({ timestamp: blockNumber }),
      getTransaction: async ({ hash }: { hash: Hex }) => ({ input: hash === txHash ? input : '0x' as Hex }),
    } as unknown as PublicClient

    const resolvedPayloads = await resolveQueuedPayloadsFromTransactionInputs({
      client,
      extension,
      wallet,
      signer,
      chainId,
      payloads: [{ payloadHash, queuedAt: 100n }],
    })

    const resolvedPayload = resolvedPayloads.get(payloadHash.toLowerCase())
    expect(resolvedPayload?.space).toBe(payload.space)
    expect(resolvedPayload?.nonce).toBe(payload.nonce)
    expect(resolvedPayload?.calls[0]?.to).toBe(recipient)
    expect(resolvedPayload?.calls[0]?.value).toBe(123n)
  })
})

function createQueuePayloadFixture(): QueuePayloadFixture {
  const wallet = '0x1111111111111111111111111111111111111111' as Address
  const signer = '0x2222222222222222222222222222222222222222' as Address
  const extension = '0x3333333333333333333333333333333333333333' as Address
  const recipient = '0x4444444444444444444444444444444444444444' as Address
  const chainId = 137
  const payload: Payload.Calls = {
    type: 'call',
    space: 1n,
    nonce: 0n,
    calls: [
      {
        to: recipient,
        value: 123n,
        data: '0x',
        gasLimit: 0n,
        delegateCall: false,
        onlyFallback: false,
        behaviorOnError: 'revert',
      },
    ],
  }
  const payloadHash = bytesToHex(Payload.hash(wallet, chainId, payload)) as Hex
  const input = AbiFunction.encodeData(Extensions.Recovery.QUEUE_PAYLOAD, [
    wallet,
    signer,
    Payload.toAbiFormat(Payload.toRecovery(payload)),
    '0x',
  ]) as Hex
  const txHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Hex

  return { wallet, signer, extension, recipient, chainId, payload, payloadHash, input, txHash }
}
