import { Payload } from '@0xsequence/wallet-primitives'
import { Address, Hex } from 'ox'

import { RecoveryContextProps } from './wallet-recovery-context'
import { manager } from '~/manager'
import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { useFindWalletViaSigner } from './use-find-wallet-via-signer'
import { getMnemonic } from '~/utils/getMnemonic'

export function useHandleQueuePayload({
  awaitedMnemonic,
  sendRecoveryPayload,
}: {
  awaitedMnemonic: RecoveryContextProps['handle']['awaitedMnemonic']
  sendRecoveryPayload: RecoveryContextProps['handle']['sendRecoveryPayload']
}) {
  const authStore = useStore(AuthStore);
  const walletAddress = useObservable(authStore.accountAddress)
  const findWallets = useFindWalletViaSigner();

  return async function queuePayload(calls: any, chainId: number) {
    const mnemonic = await getMnemonic({ authStore })
    const walletInfo = await findWallets(mnemonic)

    if (!walletInfo || !walletInfo.recoverySignerAddress) {
      throw new Error('No recovery signer address found')
    }

    const payloadCall: Payload.Calls = {
      type: 'call',
      space: Hex.toBigInt(Hex.random(20)),
      nonce: 0n,
      calls,
    }

    const recoveryPayloadId = await manager.recovery.queuePayload(
      walletAddress as Address.Address,
      chainId,
      payloadCall
    ).catch(err => {
      console.log(err)
    })

    if (!recoveryPayloadId) {
      return
    }

    manager.signatures.onSignatureRequestUpdate(
      recoveryPayloadId,
      async request => {
        const actionSigner = request?.signers.find(
          signer =>
            signer.status === 'actionable' &&
            signer.address.toLowerCase() ===
            walletInfo.recoverySignerAddress.toLowerCase()
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

        awaitedMnemonic.resolve(mnemonic)
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
