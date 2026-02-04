import { AddIcon, Button, Card, Modal, Spinner, Text, useMediaQuery } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { useMemo, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'
import { TokenStore } from '~/stores/TokenStore'
import { WalletStore } from '~/stores/WalletStore'

import { FilledCheckBox } from '~/components/misc'

import CoinIcon from '~/assets/icons/coin.svg'

import ImportToken from './ImportToken'
import TokenBalanceItem from './TokenBalanceItem'

export default function TokenList({ onSendClick }: { onSendClick: (tokenBalance: TokenBalance) => void }) {
  const isMobile = useMediaQuery('isMobile')

  const walletStore = useStore(WalletStore)
  const tokenStore = useStore(TokenStore)
  const networkStore = useStore(NetworkStore)
  const balances = useObservable(tokenStore.balances)

  const isFetchingBalances = useObservable(tokenStore.isFetchingBalances)
  const isConnected = useObservable(walletStore.selectedExternalProvider) !== undefined

  const [isImportTokenViewOpen, setIsImportTokenViewOpen] = useState(false)
  const [filterZeroBalances, setFilterZeroBalances] = useState(true)

  const filteredBalance = useMemo(() => {
    const uniqueBalances = new Map<string, TokenBalance>()

    const shouldIncludeBalance = (balance: TokenBalance) => !filterZeroBalances || balance.balance !== '0'

    balances.forEach(balance => {
      if (networkStore.networks.get().find(network => network.chainId === balance.chainId)?.disabled) {
        return
      }

      const key = `${balance.contractAddress}-${balance.chainId}`
      if (!uniqueBalances.has(key) && shouldIncludeBalance(balance)) {
        uniqueBalances.set(key, balance)
      }
    })

    return Array.from(uniqueBalances.values())
  }, [balances, filterZeroBalances, isFetchingBalances])

  return (
    <div className='flex flex-col'>
      <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
        <div className='flex flex-row items-center gap-2'>
          <img src={CoinIcon} alt="Coins" className='w-4 h-4' />

          <Text variant="normal" fontWeight="bold" color="text100">
            Coins
          </Text>
        </div>

        <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 sm:ml-auto'>
          <div
            className='flex flex-row items-center cursor-pointer gap-2'
            onClick={() => setFilterZeroBalances(!filterZeroBalances)}
          >
            <FilledCheckBox checked={filterZeroBalances} size="md" />

            <Text variant="small" color="text80">
              Filter zero balances
            </Text>
          </div>

          <Button
            size="sm"
            shape="square"
            onClick={() => setIsImportTokenViewOpen(true)}
            className='w-full sm:w-auto'
          >
            <AddIcon />
            Import
          </Button>
        </div>
      </div>

      <div className='my-2' />

      <div className='flex flex-col gap-2'>
        {isFetchingBalances ? (
          <div className='flex flex-row items-center justify-center mt-4'>
            <Spinner size="lg" />
          </div>
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
                  />
                ))}
              </>
            ) : (
              <Card className='flex flex-col'>
                <Text variant="normal" color="text50" className='text-center p-4'>
                  Import ERC 20 token address
                </Text>
              </Card>
            )}
          </>
        )}
      </div>

      {isImportTokenViewOpen && (
        <Modal
          size="lg"
          onClose={() => setIsImportTokenViewOpen(false)}
          contentProps={{
            style: {
              scrollbarColor: 'gray black',
              scrollbarWidth: 'thin',
              width: '100%',
              maxWidth: !isMobile ? '800px' : '100%',
              minHeight: 'auto',
              maxHeight: !isMobile ? '80%' : '90%',
              overflow: 'hidden'
            }
          }}
        >
          <ImportToken onClose={() => setIsImportTokenViewOpen(false)} />
        </Modal>
      )}
    </div>
  )
}
