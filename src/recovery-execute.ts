import {
  Constants,
  Extensions,
  Payload,
  Signature as PrimitiveSignature,
} from '@0xsequence/wallet-primitives'
import { AbiFunction, Bytes, Hex } from 'ox'
import compareAddress from '~/utils/compareAddress'
import { makeRpcClient } from '~/utils/rpcClient'
import { arweaveReader } from '~/arweave-reader'
import type { RecoverySignerMatch } from '~/hooks/use-validate-signer'
import { networks } from '~/networks'

export type BuildRecoveryExecuteParams = {
  walletAddress: `0x${string}`
  recoverySignerAddress: `0x${string}`
  payload: Payload.Calls
  chainId: number
  match: RecoverySignerMatch
}

export type RecoveryExecuteTx = {
  to: `0x${string}`
  data: `0x${string}`
}

const ZERO_HASH = `0x${'0'.repeat(64)}` as `0x${string}`

type ExecutionWalletState = {
  walletConfig: RecoverySignerMatch['walletConfig']
  pendingUpdates: RecoverySignerMatch['pendingUpdates']
}

async function readStage2ImageHash(
  walletAddress: `0x${string}`,
  chainId: number,
  match: RecoverySignerMatch,
): Promise<`0x${string}` | undefined> {
  const rpcUrl = networks.find(network => network.chainId === chainId)?.rpcUrl
  if (!rpcUrl) {
    throw new Error('rpc_not_found')
  }

  const client = makeRpcClient(rpcUrl)

  let implementation: `0x${string}` | undefined
  try {
    const result = await client.call({
      to: walletAddress,
      data: AbiFunction.encodeData(Constants.GET_IMPLEMENTATION) as `0x${string}`,
    })

    if (result.data && result.data.length >= 42) {
      implementation = `0x${result.data.slice(-40)}` as `0x${string}`
    }
  } catch {
    return undefined
  }

  if (!implementation || !compareAddress(implementation, match.deployContext.stage2)) {
    return undefined
  }

  const imageHash = await client.call({
    to: walletAddress,
    data: AbiFunction.encodeData(Constants.IMAGE_HASH) as `0x${string}`,
  })

  if (!imageHash.data || imageHash.data === ZERO_HASH) {
    throw new Error('onchain_image_hash_not_found')
  }

  return imageHash.data as `0x${string}`
}

async function getExecutionWalletState(
  walletAddress: `0x${string}`,
  chainId: number,
  match: RecoverySignerMatch,
): Promise<ExecutionWalletState> {
  const onChainImageHash = await readStage2ImageHash(walletAddress, chainId, match)
    ?? match.deployImageHash
  const updates = await arweaveReader.getConfigurationUpdates(walletAddress, onChainImageHash)
  const latestImageHash = updates.length > 0
    ? updates[updates.length - 1].imageHash
    : onChainImageHash

  const walletConfig = await arweaveReader.getConfiguration(latestImageHash)
  if (!walletConfig) {
    throw new Error('wallet_config_not_found')
  }

  return {
    walletConfig,
    pendingUpdates: [...updates].reverse() as RecoverySignerMatch['pendingUpdates'],
  }
}

export async function buildRecoveryExecuteTx({
  walletAddress,
  recoverySignerAddress,
  payload,
  chainId,
  match,
}: BuildRecoveryExecuteParams): Promise<RecoveryExecuteTx> {
  const executionState = await getExecutionWalletState(walletAddress, chainId, match)
  const genericTree = await arweaveReader.getTree(match.sapientImageHash)
  if (!genericTree) {
    throw new Error('recovery_tree_not_found')
  }

  const recoveryTree = Extensions.Recovery.fromGenericTree(genericTree)
  const trimmed = Extensions.Recovery.trimTopology(recoveryTree, recoverySignerAddress)
  const sapientSigData = Extensions.Recovery.encodeTopology(trimmed)

  const filledTopology = PrimitiveSignature.fillLeaves(executionState.walletConfig.topology, leaf => {
    if (
      'imageHash' in leaf &&
      leaf.imageHash === match.sapientImageHash &&
      compareAddress(leaf.address, match.extensionAddress)
    ) {
      return {
        type: 'sapient_compact',
        address: match.extensionAddress,
        data: Hex.fromBytes(sapientSigData),
      }
    }
    return undefined
  })

  const rawSignature: PrimitiveSignature.RawSignature = {
    noChainId: false,
    configuration: { ...executionState.walletConfig, topology: filledTopology },
    suffix: executionState.pendingUpdates.length > 0
      ? executionState.pendingUpdates.map(u => u.signature)
      : undefined,
  }

  const sigBytes = PrimitiveSignature.encodeSignature(rawSignature)
  const payloadBytes = Payload.encode(payload)

  const data = AbiFunction.encodeData(Constants.EXECUTE, [
    Bytes.toHex(payloadBytes),
    Bytes.toHex(sigBytes),
  ])

  return {
    to: walletAddress,
    data: data as `0x${string}`,
  }
}
