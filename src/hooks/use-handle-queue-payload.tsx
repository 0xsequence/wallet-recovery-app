import { Payload } from '@0xsequence/wallet-primitives'
import { Address, Hex } from 'ox'

import { manager } from '~/utils/manager'

import { RecoveryContextProps } from './wallet-recovery-context'

export function useHandleQueuePayload({
  values,
  awaitedMnemonic,
  sendRecoveryPayload,
}: Pick<RecoveryContextProps, 'values'> & {
  awaitedMnemonic: RecoveryContextProps['handle']['awaitedMnemonic']
  sendRecoveryPayload: RecoveryContextProps['handle']['sendRecoveryPayload']
}) {
  return async function queuePayload(calls: any, chainId: number) {
    console.log('queuePayload', calls, chainId)
    // Create a playload with all the inventory transfer calls
    const payload: Payload.Calls = {
      type: 'call',
      space: Hex.toBigInt(Hex.random(20)),
      nonce: 0n,
      calls,
    }
    // Queue the payload
    const recoveryPayloadId = await manager.recovery.queuePayload(
      values.walletAddress as Address.Address,
      chainId,
      payload
    )

    await manager.signatures.onSignatureRequestUpdate(
      recoveryPayloadId,
      async request => {
        const actionSigner = await request?.signers.find(
          signer =>
            signer.status === 'actionable' &&
            signer.address.toLowerCase() ===
              values.walletSigner?.address.toLowerCase()
        )

        if (
          actionSigner &&
          actionSigner.status === 'actionable' &&
          actionSigner?.handle
        ) {
          actionSigner
            .handle()
            .then(async () => {
              const payload =
                await manager.recovery.completePayload(recoveryPayloadId)
              await sendRecoveryPayload(
                payload.to,
                payload.data,
                chainId,
                recoveryPayloadId
              )
            })
            .catch(e => {
              console.log(e)
            })
        }
        awaitedMnemonic.resolve(values.mnemonic)
      },
      error => {
        console.error(
          'Error fetching signature request:',
          recoveryPayloadId,
          error
        )
      },
      true
    )

    return recoveryPayloadId
  }
}
