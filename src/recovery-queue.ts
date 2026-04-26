import { Extensions, Payload } from '@0xsequence/wallet-primitives'
import { AbiFunction } from 'ox'
import type { Address, Hex, PublicClient } from 'viem'
import { toHex } from 'viem'

import compareAddress from './utils/compareAddress'

const QUEUE_LOG_TIMESTAMP_WINDOW_SECONDS = 10n * 60n
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

type RpcTopic = Hex | null
type RpcTopics = RpcTopic[]
type RpcLog = {
  data: Hex
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

    const decodedPayloadHash = Extensions.Recovery.hashRecoveryPayload(
      payload,
      decodedWallet,
      chainId,
      decodedPayload.noChainId
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

  const logs = await findCandidateQueueLogs({
    client,
    extension,
    wallet,
    signer,
    payloads,
  })
  const result = new Map<string, Payload.Calls>()
  const seenTransactions = new Set<Hex>()

  for (const log of logs) {
    if (!log.transactionHash) {
      continue
    }

    const payloadHash = payloadHashFromQueueLog(log)
    if (!payloadHash || result.has(payloadHash.toLowerCase()) || seenTransactions.has(log.transactionHash)) {
      continue
    }

    seenTransactions.add(log.transactionHash)

    const transaction = await client.getTransaction({ hash: log.transactionHash })
    const payload = decodeQueuedPayloadInput({
      input: transaction.input,
      wallet,
      signer,
      payloadHash,
      chainId,
    })

    if (payload) {
      result.set(payloadHash.toLowerCase(), payload)
    }
  }

  return result
}

async function findCandidateQueueLogs({
  client,
  extension,
  wallet,
  signer,
  payloads,
}: Omit<QueuePayloadLogLookupParams, 'chainId'>): Promise<RpcLog[]> {
  const wantedHashes = new Set(payloads.map(payload => payload.payloadHash.toLowerCase()))
  const logs = await getRawLogs(client, extension, {
    fromBlock: 0n,
    toBlock: 'latest',
    topics: walletSignerTopicFilter(wallet, signer),
  })

  if (logs) {
    return logs.filter(log => {
      const payloadHash = payloadHashFromQueueLog(log)
      return payloadHash ? wantedHashes.has(payloadHash.toLowerCase()) : false
    })
  }

  const queuedAtValues = payloads.map(payload => payload.queuedAt)
  const minQueuedAt = queuedAtValues.reduce((min, value) => value < min ? value : min)
  const maxQueuedAt = queuedAtValues.reduce((max, value) => value > max ? value : max)
  const fromTimestamp = minQueuedAt > QUEUE_LOG_TIMESTAMP_WINDOW_SECONDS
    ? minQueuedAt - QUEUE_LOG_TIMESTAMP_WINDOW_SECONDS
    : 0n
  const toTimestamp = maxQueuedAt + QUEUE_LOG_TIMESTAMP_WINDOW_SECONDS
  const fromBlock = await findBlockAtOrAfterTimestamp(client, fromTimestamp)
  const toBlock = await findBlockAtOrAfterTimestamp(client, toTimestamp)

  return await getRawLogs(client, extension, {
    fromBlock,
    toBlock,
    topics: walletSignerTopicFilter(wallet, signer),
  }) ?? []
}

async function getRawLogs(
  client: PublicClient,
  address: Address,
  {
    fromBlock,
    toBlock,
    topics,
  }: {
    fromBlock: bigint
    toBlock: bigint | 'latest'
    topics: RpcTopics
  }
): Promise<RpcLog[] | undefined> {
  try {
    return await client.request({
      method: 'eth_getLogs',
      params: [
        {
          address,
          fromBlock: toHex(fromBlock),
          toBlock: toBlock === 'latest' ? 'latest' : toHex(toBlock),
          topics,
        },
      ],
    }) as RpcLog[]
  } catch (error) {
    console.warn('Unable to fetch recovery queue logs:', error)
    return undefined
  }
}

async function findBlockAtOrAfterTimestamp(
  client: PublicClient,
  timestamp: bigint
): Promise<bigint> {
  const latestBlockNumber = await client.getBlockNumber()
  const latestBlock = await client.getBlock({ blockNumber: latestBlockNumber })

  if (latestBlock.timestamp <= timestamp) {
    return latestBlockNumber
  }

  let low = 0n
  let high = latestBlockNumber
  let result = latestBlockNumber

  while (low <= high) {
    const mid = (low + high) / 2n
    const block = await client.getBlock({ blockNumber: mid })

    if (block.timestamp >= timestamp) {
      result = mid
      if (mid === 0n) {
        break
      }
      high = mid - 1n
    } else {
      low = mid + 1n
    }
  }

  return result
}

function walletSignerTopicFilter(wallet: Address, signer: Address): RpcTopics {
  const walletTopic = addressTopic(wallet)
  const signerTopic = addressTopic(signer)
  return [null, walletTopic, signerTopic]
}

function addressTopic(address: Address): Hex {
  return `0x${address.slice(2).toLowerCase().padStart(64, '0')}` as Hex
}

function payloadHashFromQueueLog(log: RpcLog): Hex | undefined {
  if (log.data.length < 66) {
    return undefined
  }

  return log.data.slice(0, 66) as Hex
}
