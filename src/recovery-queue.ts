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

type QueuePayloadLogLookupParams = Omit<DecodeQueuedPayloadParams, 'input'> & {
  client: PublicClient
  extension: Address
  queuedAt: bigint
}

type RpcTopic = Hex | null
type RpcTopics = RpcTopic[]
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
}: QueuePayloadLogLookupParams): Promise<Payload.Calls | undefined> {
  const logs = await findCandidateQueueLogs({
    client,
    extension,
    wallet,
    signer,
    payloadHash,
    queuedAt,
  })

  for (const log of logs) {
    if (!log.transactionHash) {
      continue
    }

    const transaction = await client.getTransaction({ hash: log.transactionHash })
    const payload = decodeQueuedPayloadInput({
      input: transaction.input,
      wallet,
      signer,
      payloadHash,
      chainId,
    })

    if (payload) {
      return payload
    }
  }

  return undefined
}

async function findCandidateQueueLogs({
  client,
  extension,
  wallet,
  signer,
  payloadHash,
  queuedAt,
}: Omit<QueuePayloadLogLookupParams, 'chainId'>): Promise<RpcLog[]> {
  const fromTimestamp = queuedAt > QUEUE_LOG_TIMESTAMP_WINDOW_SECONDS
    ? queuedAt - QUEUE_LOG_TIMESTAMP_WINDOW_SECONDS
    : 0n
  const toTimestamp = queuedAt + QUEUE_LOG_TIMESTAMP_WINDOW_SECONDS
  const fromBlock = await findBlockAtOrAfterTimestamp(client, fromTimestamp)
  const toBlock = await findBlockAtOrAfterTimestamp(client, toTimestamp)
  const seen = new Map<string, RpcLog>()

  for (const topics of queueLogTopicFilters(wallet, signer, payloadHash)) {
    const logs = await getRawLogs(client, extension, fromBlock, toBlock, topics)
    addUniqueLogs(seen, logs)
  }

  if (seen.size === 0) {
    const logs = await getRawLogs(client, extension, fromBlock, toBlock)
    addUniqueLogs(seen, logs)
  }

  return [...seen.values()]
}

async function getRawLogs(
  client: PublicClient,
  address: Address,
  fromBlock: bigint,
  toBlock: bigint,
  topics?: RpcTopics
): Promise<RpcLog[]> {
  try {
    return await client.request({
      method: 'eth_getLogs',
      params: [
        {
          address,
          fromBlock: toHex(fromBlock),
          toBlock: toHex(toBlock),
          topics,
        },
      ],
    }) as RpcLog[]
  } catch (error) {
    console.warn('Unable to fetch recovery queue logs:', error)
    return []
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

function queueLogTopicFilters(wallet: Address, signer: Address, payloadHash: Hex): RpcTopics[] {
  const walletTopic = addressTopic(wallet)
  const signerTopic = addressTopic(signer)
  return [
    [payloadHash],
    [null, payloadHash],
    [null, null, payloadHash],
    [null, null, null, payloadHash],
    [null, walletTopic, signerTopic],
    [null, signerTopic, walletTopic],
    [null, walletTopic],
    [null, null, walletTopic],
    [null, null, null, walletTopic],
    [null, signerTopic],
    [null, null, signerTopic],
    [null, null, null, signerTopic],
  ]
}

function addressTopic(address: Address): Hex {
  return `0x${address.slice(2).toLowerCase().padStart(64, '0')}` as Hex
}

function addUniqueLogs(target: Map<string, RpcLog>, logs: RpcLog[]) {
  for (const log of logs) {
    if (!log.transactionHash) {
      continue
    }

    target.set(`${log.transactionHash}:${log.logIndex}`, log)
  }
}
