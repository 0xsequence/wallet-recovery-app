import {
  Extensions,
  Payload,
  Signature as PrimitiveSignature,
} from '@0xsequence/wallet-primitives'
import { Address, Hex } from 'ox'
import { hexToBigInt, parseSignature, type Hash } from 'viem'
import { mnemonicToAccount, type HDAccount } from 'viem/accounts'

import type { RecoveryContextProps } from './wallet-recovery-context'
import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { useFindWalletViaSigner } from './use-find-wallet-via-signer'
import { getMnemonic } from '~/utils/getMnemonic'
import compareAddress from '~/utils/compareAddress'
import { findRecoverySigner } from './use-validate-signer'

export function useHandleQueuePayload({
  sendRecoveryPayload,
}: {
  sendRecoveryPayload: RecoveryContextProps['handle']['sendRecoveryPayload']
}) {
  const authStore = useStore(AuthStore);
  const walletAddress = useObservable(authStore.accountAddress)
  const findWallets = useFindWalletViaSigner();

  return async function queuePayload(calls: Payload.Call[], chainId: number) {
    const mnemonic = await getMnemonic({ authStore })
    const recoverySigner = mnemonicToAccount(mnemonic)
    const walletInfo = await findWallets(mnemonic)

    const activeWalletAddress = (walletAddress ?? walletInfo?.walletAddress) as Address.Address | undefined

    if (!walletInfo || !walletInfo.recoverySignerAddress || !activeWalletAddress) {
      throw new Error('No recovery signer address found')
    }

    if (!compareAddress(recoverySigner.address, walletInfo.recoverySignerAddress)) {
      throw new Error('Recovery signer mismatch')
    }

    if (!sendRecoveryPayload) {
      throw new Error('No external wallet sender found')
    }

    const payloadCall: Payload.Calls = {
      type: 'call',
      space: Hex.toBigInt(Hex.random(20)),
      nonce: 0n,
      calls,
    }

    const match = await findRecoverySigner(activeWalletAddress, recoverySigner.address)
    const payloadHash = Extensions.Recovery.hashRecoveryPayload(
      payloadCall,
      activeWalletAddress,
      chainId,
      false
    )
    const signature = await signRecoveryPayload(recoverySigner, payloadHash as Hash)
    const calldata = Extensions.Recovery.encodeCalldata(
      activeWalletAddress,
      Payload.toRecovery(payloadCall),
      recoverySigner.address,
      signature
    )

    const result = await sendRecoveryPayload(
      match.extensionAddress,
      calldata as `0x${string}`,
      chainId,
      payloadHash
    )

    return result?.id ?? payloadHash
  }
}

async function signRecoveryPayload(
  recoverySigner: HDAccount,
  payloadHash: Hash
): Promise<PrimitiveSignature.SignatureOfSignerLeaf> {
  const signatureHex = await recoverySigner.sign({ hash: payloadHash })
  const signature = parseSignature(signatureHex)

  return {
    type: 'hash',
    r: hexToBigInt(signature.r),
    s: hexToBigInt(signature.s),
    yParity: signature.yParity,
  }
}
