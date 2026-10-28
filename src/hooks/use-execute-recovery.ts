import { Payload } from '@0xsequence/wallet-primitives'
import { Address } from 'viem'

import compareAddress from '~/utils/compareAddress'

import { buildRecoveryExecuteTx } from '~/recovery-execute'

import { findRecoverySigner } from './use-validate-signer'

export type SendRecoveryTx = (
  to: `0x${string}`,
  data: `0x${string}`,
  chainId: number,
  recoveryPayloadId?: string
) => Promise<{ id: string | undefined; hash: `0x${string}` } | undefined>

export type ExecuteRecoveryParams = {
  walletAddress: Address
  recoverySignerAddress: Address
  payload: Payload.Calls
  chainId: number
  sendTx: SendRecoveryTx
  recoveryPayloadId?: string
  recoveryModule: Address
}

export async function executeRecovery({
  walletAddress,
  recoverySignerAddress,
  payload,
  chainId,
  sendTx,
  recoveryPayloadId,
  recoveryModule
}: ExecuteRecoveryParams) {
  const match = await findRecoverySigner(walletAddress, recoverySignerAddress)
  if (!compareAddress(match.extensionAddress, recoveryModule)) {
    throw new Error('Recovery configuration changed. Refresh the queue before executing.')
  }

  const tx = await buildRecoveryExecuteTx({
    walletAddress,
    recoverySignerAddress,
    payload,
    chainId,
    match
  })

  return sendTx(tx.to, tx.data, chainId, recoveryPayloadId)
}
