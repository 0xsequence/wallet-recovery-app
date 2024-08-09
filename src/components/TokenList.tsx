import { AddIcon, Box, Button, Spinner } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { useMemo, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { TokenStore } from '~/stores/TokenStore'

import ImportToken from './ImportToken'
import TokenBalanceItem from './TokenBalanceItem'

export default function TokenList({
  filterZeroBalances,
  onSendClick
}: {
  filterZeroBalances: boolean
  onSendClick: (tokenBalance: TokenBalance) => void
}) {
  const tokenStore = useStore(TokenStore)
  const balances = useObservable(tokenStore.balances)
  const isFetchingBalances = useObservable(tokenStore.isFetchingBalances)

  const filteredBalance = useMemo(() => {
    if (filterZeroBalances) {
      return balances.filter(balance => balance.balance !== '0')
    } else {
      return balances
    }
  }, [balances, filterZeroBalances, isFetchingBalances])

  const [isImportTokenViewOpen, setIsImportTokenViewOpen] = useState(false)

  return (
    <>
      <Box width="full" flexDirection="column" gap="4" marginBottom="8">
        {(filterZeroBalances ? filteredBalance : balances).map(balance => (
          <TokenBalanceItem
            key={balance.contractAddress + balance.chainId}
            tokenBalance={balance}
            onSendClick={() => onSendClick(balance)}
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
