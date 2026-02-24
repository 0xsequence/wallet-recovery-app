import { Address } from 'viem'
import { manager } from '~/manager'

export async function executeRecovery(
  walletAddress: Address,
  calls: any[],
  space: bigint,
  nonce: bigint,
  chainId: number,
  callback: (status: string) => void,
  provider: any
) {
  const txId = await manager.transactions.request(
    walletAddress!,
    chainId,
    calls,
    {
      noConfigUpdate: true,
      source: 'recovery_payload',
    }
  )


  await manager.transactions.define(txId, {
    nonce,
    space,
  })

  const transaction = await manager.transactions
    .get(txId)
    .then(s => s)
    .catch(e => console.log('catch', e))

  if (!transaction || transaction.status !== 'defined') {
    await manager.transactions.delete(txId)
    throw new Error('Transaction not found or unexpected status')
  }

  const relayerOptions = provider
    ? transaction.relayerOptions.find(
      option => option.relayerId === provider.info.uuid
    )
    : transaction.relayerOptions.find(
      option => option.kind === 'standard' && !option.feeOption
    )

  if (!relayerOptions) {
    await manager.transactions.delete(txId)
    throw new Error('No free relayer options found')
  }

  const requestId = await manager.transactions.selectRelayer(
    txId,
    relayerOptions.id
  )
  manager.signatures.onSignatureRequestUpdate(
    requestId,
    async request => {
      if (request.status !== 'pending') { return }
      const actionSigner = request.signers.find(
        signer =>
          signer.handler?.kind === 'recovery-extension' &&
          signer.status === 'ready'
      )

      if (!actionSigner) { return }

      if (actionSigner.status === 'ready') {
        actionSigner.handle().then(async () => {
          manager.transactions.relay(txId).catch(e => {
            if (e && e.code && e.code === 4001) {
              manager.transactions.delete(txId)
              callback('cancelled')
            }
          })
        })
      }
    },
    error => {
      console.error(
        'Error fetching signature request:',
        error
      )
    },
    true
  )

  return txId
}