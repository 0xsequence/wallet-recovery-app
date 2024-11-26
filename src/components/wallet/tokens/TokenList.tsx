import { AddIcon, Box, Button, Card, Divider, Image, Modal, Spinner, Text } from '@0xsequence/design-system'
import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { useMemo, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { TokenStore } from '~/stores/TokenStore'
import { WalletStore } from '~/stores/WalletStore'

import FilledCheckbox from '~/components/helpers/FilledCheckBox'

import CoinIcon from '~/assets/icons/coin.svg'

import ImportToken from './ImportToken'
import TokenBalanceItem from './TokenBalanceItem'

export default function TokenList({ onSendClick }: { onSendClick: (tokenBalance: TokenBalance) => void }) {
  const walletStore = useStore(WalletStore)
  const tokenStore = useStore(TokenStore)
  const balances = useObservable(tokenStore.balances)

  const isFetchingBalances = useObservable(tokenStore.isFetchingBalances)
  const isConnected = useObservable(walletStore.selectedExternalProvider) !== undefined

  const [isImportTokenViewOpen, setIsImportTokenViewOpen] = useState(false)
  const [filterZeroBalances, setFilterZeroBalances] = useState(true)

  const filteredBalance = useMemo(() => {
    const uniqueBalances = new Map<string, TokenBalance>()

    const shouldIncludeBalance = (balance: TokenBalance) => !filterZeroBalances || balance.balance !== '0'

    balances.forEach(balance => {
      const key = `${balance.contractAddress}-${balance.chainId}`
      if (!uniqueBalances.has(key) && shouldIncludeBalance(balance)) {
        uniqueBalances.set(key, balance)
      }
    })

    return Array.from(uniqueBalances.values())
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

          <Button
            size="sm"
            leftIcon={AddIcon}
            label="Import"
            shape="square"
            onClick={() => setIsImportTokenViewOpen(true)}
          />
        </Box>
      </Box>

      <Divider marginY="2" />

      <Box width="full" flexDirection="column" gap="2">
        {isFetchingBalances ? (
          <Box marginTop="4" alignItems="center" justifyContent="center">
            <Spinner size="lg" />
          </Box>
        ) : (
          <>
            {filteredBalance.length > 0 ? (
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
            ) : (
              <Card flexDirection="column">
                <Text alignSelf="center" variant="large" color="text50" padding="4">
                  Import ERC 20 token address
                </Text>
              </Card>
            )}
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
