import { AddIcon, Box, Button, Spinner } from '@0xsequence/design-system'
import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { useMemo, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { TokenStore } from '~/stores/TokenStore'
import { WalletStore } from '~/stores/WalletStore'

import ImportToken from './ImportToken'
import TokenBalanceItem from './TokenBalanceItem'

export default function TokenList({
  filterZeroBalances,
  onSendClick
}: {
  filterZeroBalances: boolean
  onSendClick: (tokenBalance: TokenBalance) => void
}) {
  const walletStore = useStore(WalletStore)
  const tokenStore = useStore(TokenStore)
  const balances = useObservable(tokenStore.balances)
  const isFetchingBalances = useObservable(tokenStore.isFetchingBalances)
  const isConnected = useObservable(walletStore.selectedExternalProvider) !== undefined

  const filteredBalance = useMemo(() => {
    if (filterZeroBalances) {
      return balances.filter(balance => balance.balance !== '0')
    } else {
      return balances
    }
  }, [balances, filterZeroBalances, isFetchingBalances])

  const [isImportTokenViewOpen, setIsImportTokenViewOpen] = useState(false)

  const onRemoveClick = (balance: TokenBalance) => balance.contractType === ContractType.NATIVE ? undefined : () => {
    tokenStore.removeToken({
      chainId: balance.chainId,
      address: balance.contractAddress,
      contractType: balance.contractType,
      decimals: balance.contractInfo?.decimals!,
      symbol: balance.contractInfo?.symbol!
    })
  }

  return (
    <>
      <Box width="full" flexDirection="column" gap="4" marginBottom="8">
        {filteredBalance.map(balance => (
          <TokenBalanceItem
            key={balance.contractAddress + balance.chainId}
            tokenBalance={balance}
            disabled={!isConnected}
            onSendClick={() => onSendClick(balance)}
            onRemoveClick={onRemoveClick(balance)}
          />
        ))}
        {isFetchingBalances && (
          <Box marginTop="4" alignItems="center" justifyContent="center">
            <Spinner size="lg" />
          </Box>
        )}
      </Box>
      {isImportTokenViewOpen && <ImportToken onClose={() => setIsImportTokenViewOpen(false)} />}
      {!isImportTokenViewOpen && (
        <Box width="full" alignItems="center" justifyContent="center" marginBottom="4">
          <Button
            label="Import token"
            leftIcon={AddIcon}
            variant="primary"
            size="md"
            shape="square"
            onClick={() => {
              setIsImportTokenViewOpen(true)
            }}
          />
        </Box>
      )}
    </>
  )
}
