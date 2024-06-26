import { AddIcon, Box, Button, Card, Modal, Spinner, Switch, Text } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { useMemo, useState } from 'react'

import { useMemoizedObservable, useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { TokenStore } from '~/stores/TokenStore'

import AddToken from '~/components/AddToken'
import Networks from '~/components/Networks'
import TokenBalanceItem from '~/components/TokenBalanceItem'

import sequenceLogo from '~/assets/images/sequence-logo.svg'

function Wallet() {
  const authStore = useStore(AuthStore)
  const accountAddress = useObservable(authStore.accountAddress)

  const tokenStore = useStore(TokenStore)
  const balances = useObservable(tokenStore.balances)
  const isFetchingBalances = useObservable(tokenStore.isFetchingBalances)

  const [filterZeroBalances, setFilterZeroBalances] = useState(true)
  const filteredBalance = useMemo(() => {
    if (filterZeroBalances) {
      return balances.filter(balance => balance.balance !== '0')
    } else {
      return balances
    }
  }, [balances, filterZeroBalances, isFetchingBalances])

  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
  const handleNetworkModalClose = () => {
    setIsNetworkModalOpen(false)
  }

  const [isImportTokenViewOpen, setIsImportTokenViewOpen] = useState(false)
  const handleImportTokenViewClose = () => {
    setIsImportTokenViewOpen(false)
  }

  return (
    <>
      <Box
        flexDirection="column"
        background="backgroundPrimary"
        width="full"
        height="full"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          flexDirection="row"
          width="full"
          background="backgroundMuted"
          paddingX="8"
          paddingY="4"
          alignItems="center"
        >
          <img src={sequenceLogo} alt="Sequence Logo" width="40" />
          <Box marginLeft="auto">
            <Button
              label="Networks"
              variant="text"
              marginRight="8"
              onClick={() => setIsNetworkModalOpen(true)}
            />
            <Button label="Settings" variant="text" />
          </Box>
        </Box>
        <Box width="full" paddingX="8" style={{ maxWidth: '800px' }}>
          <Card alignItems="center" flexDirection="column" padding="6" marginTop="16">
            <Text variant="large" color="text80" marginBottom="4">
              Your recovered wallet address
            </Text>
            <Text variant="normal" color="text100">
              {accountAddress}
            </Text>
          </Card>
          <Box flexDirection="column" alignItems="flex-start" justifyContent="flex-start" marginTop="8">
            <Box width="full" flexDirection="row" alignItems="center" marginBottom="4">
              <Text variant="large" color="text80">
                Coins
              </Text>

              <Box marginLeft="auto">
                <Switch
                  label="Filter zero balances"
                  checked={filterZeroBalances}
                  onCheckedChange={setFilterZeroBalances}
                />
              </Box>
            </Box>

            <Box width="full" flexDirection="column" gap="4" marginBottom="8">
              {(filterZeroBalances ? filteredBalance : balances).map(balance => (
                <TokenBalanceItem key={balance.contractAddress + balance.chainId} tokenBalance={balance} />
              ))}
              {isFetchingBalances && (
                <Box marginTop="4" alignItems="center" justifyContent="center">
                  <Spinner size="lg" />
                </Box>
              )}
            </Box>
            {isImportTokenViewOpen && <AddToken onClose={handleImportTokenViewClose} />}
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
          </Box>
          <Box alignItems="flex-start" justifyContent="flex-start" marginTop="8">
            <Text variant="large" color="text80" marginBottom="4">
              Collectibles
            </Text>
          </Box>
        </Box>
      </Box>
      {isNetworkModalOpen && (
        <Modal onClose={handleNetworkModalClose}>
          <Networks />
        </Modal>
      )}
    </>
  )
}

export default Wallet
