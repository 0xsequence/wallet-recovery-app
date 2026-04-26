import { Config, Context, Extensions, Signature } from '@0xsequence/wallet-primitives'
import { Address } from 'viem'

import { arweaveReader } from '~/arweave-reader'
import compareAddress from '~/utils/compareAddress'

import { useWalletRecovery } from './wallet-recovery-context'

export type RecoverySignerMatch = {
  leaf: Extensions.Recovery.RecoveryLeaf
  extensionAddress: Address
  sapientImageHash: `0x${string}`
  deployImageHash: `0x${string}`
  walletConfig: Config.Config
  deployContext: Context.Context
  /** Pending config updates in reverse chronological order (newest first). */
  pendingUpdates: Array<{ imageHash: `0x${string}`; signature: Signature.RawSignature }>
}

/**
 * Resolves the wallet's latest config from Arweave, finds the recovery
 * sapient-signer leaf, and confirms the given signer address is present
 * as a RecoveryLeaf inside the recovery tree. Returns both the matched
 * leaf and the recovery extension contract address (= the sapient leaf's
 * `address`), which downstream on-chain calls need.
 *
 * Replaces hosted recovery signer lookup with a direct read path
 * so recovery keeps working if the hosted lookup service is unavailable.
 */
export async function findRecoverySigner(
  walletAddress: Address,
  recoverySignerAddress: Address
): Promise<RecoverySignerMatch> {
  const deploy = await arweaveReader.getDeploy(walletAddress)
  if (!deploy) {
    throw new Error('no_signers')
  }

  const updates = await arweaveReader.getConfigurationUpdates(walletAddress, deploy.imageHash)
  const latestImageHash = updates.length > 0 ? updates[updates.length - 1].imageHash : deploy.imageHash
  const pendingUpdates = [...updates].reverse() as Array<{
    imageHash: `0x${string}`
    signature: typeof updates[number]['signature']
  }>

  const config = await arweaveReader.getConfiguration(latestImageHash)
  if (!config) {
    throw new Error('no_signers')
  }

  const sapientSigners = Config.topologyToFlatLeaves(config.topology).filter(Config.isSapientSignerLeaf)
  if (sapientSigners.length === 0) {
    throw new Error('no_signers')
  }

  for (const sapient of sapientSigners) {
    const genericTree = await arweaveReader.getTree(sapient.imageHash)
    if (!genericTree) {
      continue
    }

    let recoveryTree: Extensions.Recovery.Tree
    try {
      recoveryTree = Extensions.Recovery.fromGenericTree(genericTree)
    } catch {
      // Not a recovery tree (could be some other sapient signer's data), skip.
      continue
    }

    const { leaves } = Extensions.Recovery.getRecoveryLeaves(recoveryTree)
    const match = leaves.find(leaf => compareAddress(leaf.signer, recoverySignerAddress))
    if (match) {
      return {
        leaf: match,
        extensionAddress: sapient.address as Address,
        sapientImageHash: sapient.imageHash as `0x${string}`,
        deployImageHash: deploy.imageHash as `0x${string}`,
        walletConfig: config,
        deployContext: deploy.context,
        pendingUpdates,
      }
    }
  }

  throw new Error('signer_not_found')
}

export function useValidateSigner() {
  const { set } = useWalletRecovery()

  return async function validateSigner(
    walletAddress: Address,
    recoverySignerAddress: Address
  ) {
    const { leaf } = await findRecoverySigner(walletAddress, recoverySignerAddress)

    set.walletSigner(leaf)
    set.walletAddress(walletAddress)

    return leaf
  }
}
