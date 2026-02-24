import { useState, useEffect } from "react"
import { Sequence } from "@0xsequence/wallet-wdk"
import { manager } from "~/manager"
import { executeRecovery } from "./use-execute-recovery"

interface UsePayloadExecutionParams {
  payload: Sequence.QueuedRecoveryPayload
  selectedExternalProvider: any
}

export function usePayloadExecution({ payload, selectedExternalProvider }: UsePayloadExecutionParams) {
  const [isExecuted, setIsExecuted] = useState(false)
  const [txId, setTxId] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [transaction, setTransaction] = useState<Sequence.Transaction | null>(null)

  // Check if payload has already been executed
  useEffect(() => {
    async function checkIfExecuted() {
      try {
        // @ts-expect-error payload.payload.space and nonce exist at runtime
        const space = payload.payload?.space
        // @ts-expect-error payload.payload.nonce exists at runtime
        const payloadNonce = payload.payload?.nonce

        if (space !== undefined && payloadNonce !== undefined) {
          const currentNonce = await manager.wallets.getNonce(
            payload.chainId,
            payload.wallet,
            space
          )
          // If current nonce is greater than payload nonce, it has been executed
          setIsExecuted(currentNonce > payloadNonce)
        }
      } catch (error) {
        console.error('Error checking if payload is executed:', error)
      }
    }

    checkIfExecuted()
    // @ts-expect-error payload.payload.space and nonce exist at runtime
  }, [payload.chainId, payload.wallet, payload.payload?.space, payload.payload?.nonce])

  // Monitor transaction updates
  useEffect(() => {
    if (txId) {
      manager.transactions
        .get(txId)
        .then(tx => {
          manager.transactions.onTransactionUpdate(
            tx.id,
            handleTransactionUpdate,
            true
          )
        })
        .catch(e => {
          console.log('Error getting transaction:', e)
        })
    }
  }, [txId])

  function handleTransactionUpdate(tx: Sequence.Transaction) {
    if (tx) {
      setTransaction(tx)
    }
  }

  const handleExecuteRecovery = async () => {
    setIsPending(true)
    
    const txId = await executeRecovery(
      payload.wallet,
      // @ts-expect-error TODO fix this. payload.payload should have calls
      payload.payload?.calls,
      // @ts-expect-error TODO fix this. payload.payload should have space
      payload.payload.space,
      // @ts-expect-error TODO fix this. payload.payload should have nonce
      payload.payload.nonce,
      payload.chainId,
      () => {
        setIsPending(false)
      },
      selectedExternalProvider
    )

    if (txId) {
      setTxId(txId)
    }
  }

  const hash = transaction?.status === 'final' 
    ? transaction?.opStatus.status === 'confirmed' 
      ? transaction?.opStatus.transactionHash 
      : null 
    : null

  const status = transaction?.status
  const opStatus = status === 'final' ? transaction?.opStatus.status : null

  return {
    isExecuted,
    isPending,
    transaction,
    hash,
    status,
    opStatus,
    handleExecuteRecovery
  }
}
