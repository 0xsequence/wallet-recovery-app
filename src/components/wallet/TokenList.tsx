import { AddIcon, Box, Button, Divider, Image, Modal, Spinner, Switch, Text } from '@0xsequence/design-system'
import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { useMemo, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { TokenStore } from '~/stores/TokenStore'
import { WalletStore } from '~/stores/WalletStore'

import FilledCheckbox from '~/components/helpers/FilledCheckBox'

import CoinIcon from '~/assets/icons/coin.svg'
import CollectionIcon from '~/assets/icons/collection.svg'

import TokenBalanceItem from '../TokenBalanceItem'
import ImportToken from './ImportToken'

export default function TokenList({ onSendClick }: { onSendClick: (tokenBalance: TokenBalance) => void }) {
  const walletStore = useStore(WalletStore)
  const tokenStore = useStore(TokenStore)
  const balances = useObservable(tokenStore.balances)
  const isFetchingBalances = useObservable(tokenStore.isFetchingBalances)
  const isConnected = useObservable(walletStore.selectedExternalProvider) !== undefined

  const isFetchingTokenInfo = useObservable(tokenStore.isFetchingTokenInfo)

  const [isImportTokenViewOpen, setIsImportTokenViewOpen] = useState(false)
  const [filterZeroBalances, setFilterZeroBalances] = useState(true)

  const filteredBalance = useMemo(() => {
    if (filterZeroBalances) {
      return balances.filter(balance => balance.balance !== '0')
    } else {
      return balances
    }
  }, [balances, filterZeroBalances, isFetchingBalances])

  const onRemoveClick = (balance: TokenBalance) =>
    balance.contractType === ContractType.NATIVE
      ? undefined
      : () => {
          tokenStore.removeToken({
            chainId: balance.chainId,
            address: balance.contractAddress,
            contractType: balance.contractType,
            decimals: balance.contractInfo?.decimals!,
            symbol: balance.contractInfo?.symbol!
          })
        }

  return (
    <Box>
      <Box justifyContent="space-between" alignItems="center">
        <Box gap="2">
          <Image src={CoinIcon} width="7" height="7" />

          <Text variant="large" fontWeight="bold" color="text100">
            Coins
          </Text>
        </Box>
        <Box gap="4">
          <Box
            flexDirection="row"
            alignItems="center"
            cursor="pointer"
            gap="2"
            onClick={() => setFilterZeroBalances(!filterZeroBalances)}
          >
            <FilledCheckbox checked={filterZeroBalances} />

            <Text variant="normal" fontWeight="medium" color="text80">
              Filter zero balances
            </Text>
          </Box>
          {isFetchingTokenInfo ? (
            <Spinner size="lg" />
          ) : (
            <Button
              size="sm"
              leftIcon={AddIcon}
              label="Import"
              shape="square"
              onClick={() => setIsImportTokenViewOpen(true)}
            />
          )}
        </Box>
      </Box>

      <Divider marginY="2" />

      <Box width="full" flexDirection="column" gap="4" marginBottom="8">
        {isFetchingBalances ? (
          <Box marginTop="4" alignItems="center" justifyContent="center">
            <Spinner size="lg" />
          </Box>
        ) : (
          <>
            {filteredBalance.map(balance => (
              <TokenBalanceItem
                key={balance.contractAddress + balance.chainId}
                tokenBalance={balance}
                disabled={!isConnected}
                onSendClick={() => onSendClick(balance)}
                onRemoveClick={onRemoveClick(balance)}
              />
            ))}
          </>
        )}
      </Box>

      {isImportTokenViewOpen && (
        <Modal size="sm" onClose={() => setIsImportTokenViewOpen(false)}>
          <ImportToken onClose={() => setIsImportTokenViewOpen(false)} />
        </Modal>
      )}
    </Box>
  )
}
