import { Config, Extensions } from '@0xsequence/wallet-primitives'
import { Address } from 'viem'

import { arweaveReader } from '~/arweave-reader'
import compareAddress from '~/utils/compareAddress'

import { useWalletRecovery } from './wallet-recovery-context'

/**
 * Resolves the wallet's latest config from Arweave, finds the recovery
 * sapient-signer leaf, and confirms the given signer address is present
 * as a RecoveryLeaf inside the recovery tree.
 *
 * Replaces `manager.recovery.getSigners(wallet)` with a direct read path
 * so recovery keeps working if Sequence's keymachine proxy is unavailable.
 */
export async function findRecoverySigner(
  walletAddress: Address,
  recoverySignerAddress: Address
): Promise<Extensions.Recovery.RecoveryLeaf> {
  const deploy = await arweaveReader.getDeploy(walletAddress)
  if (!deploy) {
    throw new Error('no_signers')
  }

  const updates = await arweaveReader.getConfigurationUpdates(walletAddress, deploy.imageHash)
  const latestImageHash = updates.length > 0 ? updates[updates.length - 1].imageHash : deploy.imageHash

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
      return match
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
    const walletSigner = await findRecoverySigner(walletAddress, recoverySignerAddress)

    set.walletSigner(walletSigner)
    set.walletAddress(walletAddress)

    return walletSigner
  }
}
