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
  const blockRanges = timestampWindows.map(([from, to]) => estimator.rangeFor(from, to))

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
  const seenTransactions = new Set<Hex>()
  const unresolvedPayloads = new Map(
    payloads.map(payload => [payload.payloadHash.toLowerCase(), payload.payloadHash])
  )

  for (const log of allLogs) {
    if (!log.transactionHash || seenTransactions.has(log.transactionHash) || unresolvedPayloads.size === 0) {
      continue
    }

    seenTransactions.add(log.transactionHash)

    const transaction = await client.getTransaction({ hash: log.transactionHash })
    for (const candidatePayloadHash of [...unresolvedPayloads.values()]) {
      const payload = decodeQueuedPayloadInput({
        input: transaction.input,
        wallet,
        signer,
        payloadHash: candidatePayloadHash,
        chainId,
      })

      if (payload) {
        result.set(candidatePayloadHash.toLowerCase(), payload)
        unresolvedPayloads.delete(candidatePayloadHash.toLowerCase())
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
  latestNumber: bigint
  rangeFor: (fromTimestamp: bigint, toTimestamp: bigint) => { fromBlock: bigint; toBlock: bigint }
}

async function createBlockEstimator(client: PublicClient): Promise<BlockEstimator> {
  const latestNumber = await client.getBlockNumber()
  const latest = await client.getBlock({ blockNumber: latestNumber })

  const sampleDistance = latestNumber > BLOCK_TIME_SAMPLE_DISTANCE
    ? BLOCK_TIME_SAMPLE_DISTANCE
    : latestNumber
  const sampleNumber = latestNumber - sampleDistance
  const sample = sampleDistance === 0n
    ? latest
    : await client.getBlock({ blockNumber: sampleNumber })

  const blockSpan = latestNumber - sampleNumber
  const timeSpan = latest.timestamp > sample.timestamp ? latest.timestamp - sample.timestamp : 1n
  const secondsPerBlock = blockSpan > 0n ? timeSpan / blockSpan : 1n
  const divisor = secondsPerBlock > 0n ? secondsPerBlock : 1n

  const estimate = (timestamp: bigint): bigint => {
    if (timestamp >= latest.timestamp) {
      return latestNumber
    }
    const blocksBack = (latest.timestamp - timestamp) / divisor
    return blocksBack >= latestNumber ? 0n : latestNumber - blocksBack
  }

  return {
    latestNumber,
    rangeFor: (fromTimestamp, toTimestamp) => {
      if (latest.timestamp <= fromTimestamp) {
        return { fromBlock: latestNumber, toBlock: latestNumber }
      }
      const fromEstimate = estimate(fromTimestamp)
      const toEstimate = estimate(toTimestamp)
      const fromBlock = fromEstimate > BLOCK_ESTIMATE_BUFFER ? fromEstimate - BLOCK_ESTIMATE_BUFFER : 0n
      const toBlock = toEstimate + BLOCK_ESTIMATE_BUFFER > latestNumber
        ? latestNumber
        : toEstimate + BLOCK_ESTIMATE_BUFFER
      return { fromBlock, toBlock }
    },
  }
}
