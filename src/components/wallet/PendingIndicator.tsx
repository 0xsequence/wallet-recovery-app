import { Box, BoxProps, Text } from '@0xsequence/design-system'
import { useObservable } from 'micro-observables'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

import PendingTxn from '../PendingTxn'

export default function PendingIndicator({ ...rest }: BoxProps) {
  const walletStore = useStore(WalletStore)

  const isSendingToken = useObservable(walletStore.isSendingTokenTransaction)
  const isSendingCollectible = useObservable(walletStore.isSendingCollectibleTransaction)
  const isSendingSignedTokenTransaction = useObservable(walletStore.isSendingSignedTokenTransaction)

  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center" width="full" gap="4" {...rest}>
      {isSendingToken && (
        <PendingTxn
          symbol={isSendingToken.tokenBalance?.contractInfo?.symbol ?? ''}
          chainId={isSendingToken.tokenBalance.chainId}
          to={isSendingToken.to}
          amount={isSendingToken.amount}
        />
      )}
      {isSendingCollectible && (
        <PendingTxn
          symbol={isSendingCollectible.collectibleInfo.collectibleInfoResponse.name ?? ''}
          chainId={isSendingCollectible.collectibleInfo.collectibleInfoParams.chainId}
          to={isSendingCollectible.to}
          amount={isSendingCollectible.amount}
        />
      )}
      {isSendingSignedTokenTransaction && (
        <PendingTxn
          symbol={'tokens'}
          chainId={isSendingSignedTokenTransaction.chainId!}
          to={isSendingSignedTokenTransaction.txn[0].to as string}
          amount={String(Number(isSendingSignedTokenTransaction.txn[0].value))}
        />
      )}
    </Box>
  )
}
