import { Extensions, Payload } from '@0xsequence/wallet-primitives'
import { AbiFunction } from 'ox'
import type { Address, Hex, PublicClient } from 'viem'
import { bytesToHex, toHex } from 'viem'

import compareAddress from './utils/compareAddress'

const QUEUE_LOG_TIMESTAMP_WINDOW_SECONDS = 10n * 60n
const GET_LOGS_CHUNK_SIZE = 1000n
const BLOCK_TIME_SAMPLE_DISTANCE = 5_000n
const BLOCK_ESTIMATE_BUFFER = 500n
const QUEUE_PAYLOAD_SELECTOR = AbiFunction.getSelector(Extensions.Recovery.QUEUE_PAYLOAD)

type QueuePayloadDecoded = [
  wallet: Address,
  signer: Address,
  payload: Payload.SolidityDecoded,
  signature: Hex,
]

type DecodeQueuedPayloadParams = {
  input: Hex
  wallet: Address
  signer: Address
  payloadHash: Hex
  chainId: number
}

type QueuedPayloadLookup = {
  payloadHash: Hex
  queuedAt: bigint
}

type QueuePayloadLogLookupParams = Omit<DecodeQueuedPayloadParams, 'input' | 'payloadHash'> & {
  client: PublicClient
  extension: Address
  payloads: QueuedPayloadLookup[]
}

type RpcLog = {
  transactionHash: Hex | null
  logIndex: Hex
}

export function decodeQueuedPayloadInput({
  input,
  wallet,
  signer,
  payloadHash,
  chainId,
}: DecodeQueuedPayloadParams): Payload.Calls | undefined {
  try {
    if (!input.toLowerCase().startsWith(QUEUE_PAYLOAD_SELECTOR)) {
      return undefined
    }

    const [decodedWallet, decodedSigner, decodedPayload] = AbiFunction.decodeData(
      Extensions.Recovery.QUEUE_PAYLOAD,
      input
    ) as QueuePayloadDecoded

    if (!compareAddress(decodedWallet, wallet) || !compareAddress(decodedSigner, signer)) {
      return undefined
    }

    const payload = Payload.fromAbiFormat(decodedPayload)
    if (!Payload.isCalls(payload)) {
      return undefined
    }

    const decodedPayloadHash = bytesToHex(
      Payload.hash(decodedWallet, decodedPayload.noChainId ? 0 : chainId, payload)
    )

    if (decodedPayloadHash.toLowerCase() !== payloadHash.toLowerCase()) {
      return undefined
    }

    return payload
  } catch {
    return undefined
  }
}

export async function resolveQueuedPayloadFromTransactionInput({
  client,
  extension,
  wallet,
  signer,
  payloadHash,
  chainId,
  queuedAt,
}: Omit<QueuePayloadLogLookupParams, 'payloads'> & QueuedPayloadLookup): Promise<Payload.Calls | undefined> {
  const payloads = await resolveQueuedPayloadsFromTransactionInputs({
    client,
    extension,
    wallet,
    signer,
    chainId,
    payloads: [{ payloadHash, queuedAt }],
  })

  return payloads.get(payloadHash.toLowerCase())
}

export async function resolveQueuedPayloadsFromTransactionInputs({
  client,
  extension,
  wallet,
  signer,
  chainId,
  payloads,
}: QueuePayloadLogLookupParams): Promise<Map<string, Payload.Calls>> {
  if (payloads.length === 0) {
    return new Map()
  }

  const timestampWindows = mergeTimestampWindows(
    payloads.map(payload => payload.queuedAt),
    QUEUE_LOG_TIMESTAMP_WINDOW_SECONDS
  )

  const estimator = await createBlockEstimator(client)
  const blockRanges = await Promise.all(
    timestampWindows.map(([from, to]) => estimator.rangeFor(from, to))
  )

  const ranges: { fromBlock: bigint; toBlock: bigint }[] = []
  for (const { fromBlock, toBlock } of blockRanges) {
    for (let cursor = fromBlock; cursor <= toBlock; cursor += GET_LOGS_CHUNK_SIZE) {
      const chunkEnd = cursor + GET_LOGS_CHUNK_SIZE - 1n > toBlock ? toBlock : cursor + GET_LOGS_CHUNK_SIZE - 1n
      ranges.push({ fromBlock: cursor, toBlock: chunkEnd })
    }
  }

  const chunks = await Promise.all(ranges.map(range => getRawLogs(client, extension, range)))
  const allLogs = chunks.flatMap(chunk => chunk ?? [])

  const result = new Map<string, Payload.Calls>()
  const unresolvedPayloads = new Set(payloads.map(payload => payload.payloadHash.toLowerCase() as Hex))

  // eth_getLogs filters by extension address only, so allLogs spans every wallet's
  // queue activity in the range. Dedupe the candidate transactions and fetch them in
  // parallel — one serialized round-trip per log would dominate the scan time.
  const uniqueTransactionHashes = [
    ...new Set(allLogs.map(log => log.transactionHash).filter((hash): hash is Hex => hash !== null)),
  ]
  const transactions = await Promise.all(
    uniqueTransactionHashes.map(hash => client.getTransaction({ hash }))
  )

  for (const transaction of transactions) {
    if (unresolvedPayloads.size === 0) {
      break
    }

    for (const candidatePayloadHash of unresolvedPayloads) {
      const payload = decodeQueuedPayloadInput({
        input: transaction.input,
        wallet,
        signer,
        payloadHash: candidatePayloadHash,
        chainId,
      })

      if (payload) {
        result.set(candidatePayloadHash, payload)
        unresolvedPayloads.delete(candidatePayloadHash)
        break
      }
    }
  }

  return result
}

async function getRawLogs(
  client: PublicClient,
  address: Address,
  {
    fromBlock,
    toBlock,
  }: {
    fromBlock: bigint
    toBlock: bigint
  }
): Promise<RpcLog[] | undefined> {
  try {
    return await client.request({
      method: 'eth_getLogs',
      params: [
        {
          address,
          fromBlock: toHex(fromBlock),
          toBlock: toHex(toBlock),
        },
      ],
    }) as RpcLog[]
  } catch (error) {
    console.warn('Unable to fetch recovery queue logs:', error)
    return undefined
  }
}

function mergeTimestampWindows(
  queuedAtValues: bigint[],
  windowSeconds: bigint,
): Array<[bigint, bigint]> {
  const windows = queuedAtValues
    .map<[bigint, bigint]>(queuedAt => [
      queuedAt > windowSeconds ? queuedAt - windowSeconds : 0n,
      queuedAt + windowSeconds,
    ])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))

  const merged: Array<[bigint, bigint]> = []
  for (const [from, to] of windows) {
    const last = merged[merged.length - 1]
    if (last && from <= last[1]) {
      if (to > last[1]) {
        last[1] = to
      }
    } else {
      merged.push([from, to])
    }
  }
  return merged
}

type BlockEstimator = {
  rangeFor: (fromTimestamp: bigint, toTimestamp: bigint) => Promise<{ fromBlock: bigint; toBlock: bigint }>
}

async function createBlockEstimator(client: PublicClient): Promise<BlockEstimator> {
  const latestNumber = await client.getBlockNumber()

  const timestampCache = new Map<bigint, bigint>()
  const timestampAt = async (blockNumber: bigint): Promise<bigint> => {
    const cached = timestampCache.get(blockNumber)
    if (cached !== undefined) {
      return cached
    }
    const { timestamp } = await client.getBlock({ blockNumber })
    timestampCache.set(blockNumber, timestamp)
    return timestamp
  }

  const latestTimestamp = await timestampAt(latestNumber)

  const sampleDistance = latestNumber > BLOCK_TIME_SAMPLE_DISTANCE
    ? BLOCK_TIME_SAMPLE_DISTANCE
    : latestNumber
  const sampleNumber = latestNumber - sampleDistance
  const sampleTimestamp = sampleDistance === 0n ? latestTimestamp : await timestampAt(sampleNumber)

  const blockSpan = latestNumber - sampleNumber
  const timeSpan = latestTimestamp > sampleTimestamp ? latestTimestamp - sampleTimestamp : 1n
  const secondsPerBlock = blockSpan > 0n ? timeSpan / blockSpan : 1n
  const divisor = secondsPerBlock > 0n ? secondsPerBlock : 1n

  // Linear extrapolation only seeds the search. Block time drifts over long
  // lookbacks, so the exact boundary is then found by galloping out from the
  // seed until it brackets the target and binary searching the bracket.
  const seedFor = (timestamp: bigint): bigint => {
    const blocksBack = (latestTimestamp - timestamp) / divisor
    return blocksBack >= latestNumber ? 0n : latestNumber - blocksBack
  }

  // Largest block number whose timestamp is <= target.
  const blockAtOrBefore = async (target: bigint): Promise<bigint> => {
    if (target >= latestTimestamp) {
      return latestNumber
    }

    let lo = seedFor(target)
    let hi = lo
    let step = 1n
    if ((await timestampAt(lo)) <= target) {
      while (hi < latestNumber && (await timestampAt(hi)) <= target) {
        lo = hi
        hi = hi + step > latestNumber ? latestNumber : hi + step
        step *= 2n
      }
    } else {
      while (lo > 0n && (await timestampAt(lo)) > target) {
        hi = lo
        lo = lo > step ? lo - step : 0n
        step *= 2n
      }
      if ((await timestampAt(lo)) > target) {
        return 0n
      }
    }

    while (hi - lo > 1n) {
      const mid = (lo + hi) / 2n
      if ((await timestampAt(mid)) <= target) {
        lo = mid
      } else {
        hi = mid
      }
    }
    return lo
  }

  return {
    rangeFor: async (fromTimestamp, toTimestamp) => {
      if (latestTimestamp <= fromTimestamp) {
        return { fromBlock: latestNumber, toBlock: latestNumber }
      }
      const fromExact = await blockAtOrBefore(fromTimestamp)
      const toExact = await blockAtOrBefore(toTimestamp)
      const fromBlock = fromExact > BLOCK_ESTIMATE_BUFFER ? fromExact - BLOCK_ESTIMATE_BUFFER : 0n
      const toBlock = toExact + BLOCK_ESTIMATE_BUFFER > latestNumber
        ? latestNumber
        : toExact + BLOCK_ESTIMATE_BUFFER
      return { fromBlock, toBlock }
    },
  }
}
