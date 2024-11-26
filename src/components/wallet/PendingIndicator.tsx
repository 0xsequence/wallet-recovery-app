import { Box } from '@0xsequence/design-system'
import { useObservable } from 'micro-observables'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

import PendingTxn from '../PendingTxn'

export default function PendingIndicator({ ...rest }: { [key: string]: any }) {
  const walletStore = useStore(WalletStore)

  const isSendingToken = useObservable(walletStore.isSendingTokenTransaction)
  const isSendingCollectible = useObservable(walletStore.isSendingCollectibleTransaction)
  const isSendingSignedTokenTransaction = useObservable(walletStore.isSendingSignedTokenTransaction)

  return (
    <Box flexDirection="column" width="full" gap="4" {...rest}>
      {isSendingToken && (
        <Box alignItems="center" justifyContent="center">
          <PendingTxn
            symbol={isSendingToken.tokenBalance?.contractInfo?.symbol ?? ''}
            chainId={isSendingToken.tokenBalance.chainId}
            to={isSendingToken.to}
            amount={isSendingToken.amount}
          />
        </Box>
      )}
      {isSendingCollectible && (
        <Box alignItems="center" justifyContent="center">
          <PendingTxn
            symbol={isSendingCollectible.collectibleInfo.collectibleInfoResponse.name ?? ''}
            chainId={isSendingCollectible.collectibleInfo.collectibleInfoParams.chainId}
            to={isSendingCollectible.to}
            amount={isSendingCollectible.amount}
          />
        </Box>
      )}
      {isSendingSignedTokenTransaction && (
        <Box alignItems="center" justifyContent="center">
          <PendingTxn
            symbol={'tokens'}
            chainId={isSendingSignedTokenTransaction.chainId!}
            to={isSendingSignedTokenTransaction.txn[0].to as string}
            amount={String(Number(isSendingSignedTokenTransaction.txn[0].value))}
          />
        </Box>
      )}
    </Box>
  )
}
