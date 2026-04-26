import { useState, useEffect } from 'react'
import { Constants } from '@0xsequence/wallet-primitives'
import { AbiFunction } from 'ox'
import { Address, createPublicClient, hexToBigInt, http, type PublicClient } from 'viem'

import type { ProviderDetail } from '~/components/wallet/externalprovider/SelectProvider'
import { networks } from '~/networks'
import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import type { QueuedRecoveryPayload } from '~/types/recovery'
import { useWalletRecovery } from './wallet-recovery-context'
import { executeRecovery } from './use-execute-recovery'

interface UsePayloadExecutionParams {
  payload: QueuedRecoveryPayload
  selectedExternalProvider: ProviderDetail | undefined
}

type ExecStatus = 'idle' | 'pending' | 'final'
type OpStatus = null | 'confirmed' | 'failed'

export function usePayloadExecution({ payload, selectedExternalProvider }: UsePayloadExecutionParams) {
  const { handle: { sendRecoveryPayload } } = useWalletRecovery()
  const authStore = useStore(AuthStore)
  const recoverySignerAddress = useObservable(authStore.recoverySignerAddress)

  const [isExecuted, setIsExecuted] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const [status, setStatus] = useState<ExecStatus>('idle')
  const [opStatus, setOpStatus] = useState<OpStatus>(null)

  const rpcUrl = networks.find(n => n.chainId === payload.chainId)?.rpcUrl

  useEffect(() => {
    async function checkIfExecuted() {
      try {
        const space: bigint | undefined = payload.payload?.space
        const payloadNonce: bigint | undefined = payload.payload?.nonce

        if (space === undefined || payloadNonce === undefined || !rpcUrl) {
          return
        }

        const client: PublicClient = createPublicClient({ transport: http(rpcUrl) })
        const result = await client.call({
          to: payload.wallet,
          data: AbiFunction.encodeData(Constants.READ_NONCE, [space]) as `0x${string}`,
        })

        if (!result.data) {
          return
        }

        const currentNonce = hexToBigInt(result.data)
        setIsExecuted(currentNonce > payloadNonce)
      } catch (error) {
        console.error('Error checking if payload is executed:', error)
      }
    }

    checkIfExecuted()
  }, [payload.chainId, payload.wallet, payload.payload?.space, payload.payload?.nonce, rpcUrl])

  useEffect(() => {
    if (!hash || !rpcUrl) {
      return
    }

    const client: PublicClient = createPublicClient({ transport: http(rpcUrl) })
    let cancelled = false

    client
      .waitForTransactionReceipt({ hash })
      .then(receipt => {
        if (cancelled) {
          return
        }
        setStatus('final')
        setOpStatus(receipt.status === 'success' ? 'confirmed' : 'failed')
        if (receipt.status === 'success') {
          setIsExecuted(true)
        }
        setIsPending(false)
      })
      .catch(error => {
        if (cancelled) {
          return
        }
        console.error('Error waiting for tx receipt:', error)
        setStatus('final')
        setOpStatus('failed')
        setIsPending(false)
      })

    return () => {
      cancelled = true
    }
  }, [hash, rpcUrl])

  const handleExecuteRecovery = async () => {
    if (!recoverySignerAddress || !sendRecoveryPayload || !payload.payload) {
      return
    }

    setIsPending(true)
    setStatus('idle')
    setOpStatus(null)
    setHash(null)

    try {
      console.log('[use-payload-execution] queued payload from store', {
        id: payload.id,
        wallet: payload.wallet,
        signer: payload.signer,
        chainId: payload.chainId,
        recoveryModule: payload.recoveryModule,
        onChainPayloadHash: payload.payloadHash,
        startTimestamp: String(payload.startTimestamp),
        endTimestamp: String(payload.endTimestamp),
        payloadRaw: payload.payload,
      })

      const result = await executeRecovery({
        walletAddress: payload.wallet as Address,
        recoverySignerAddress: recoverySignerAddress as Address,
        payload: payload.payload,
        chainId: payload.chainId,
        sendTx: sendRecoveryPayload,
        recoveryPayloadId: payload.id,
      })

      if (result?.hash) {
        setHash(result.hash)
      } else {
        setIsPending(false)
      }
    } catch (error) {
      console.error('Error executing recovery:', error)
      setIsPending(false)
    }
  }

  // Keep `selectedExternalProvider` referenced — UI passes it in but the
  // execution itself goes through `sendRecoveryPayload`, which already uses
  // the same provider via WalletStore.
  void selectedExternalProvider

  return {
    isExecuted,
    isPending,
    transaction: null,
    hash,
    status: status === 'idle' ? undefined : status,
    opStatus,
    handleExecuteRecovery,
  }
}
