import { Box, Button, Card, Modal, Spinner, Text } from '@0xsequence/design-system'
import { useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { TokenStore } from '~/stores/TokenStore'

import Networks from '~/components/Networks'
import TokenBalanceItem from '~/components/TokenBalanceItem'

import sequenceLogo from '~/assets/images/sequence-logo.svg'

function Wallet() {
  const authStore = useStore(AuthStore)
  const accountAddress = useObservable(authStore.accountAddress)

  const tokenStore = useStore(TokenStore)
  const balances = useObservable(tokenStore.balances)
  const isFetchingBalances = useObservable(tokenStore.isFetchingBalances)

  console.log('balances', balances)

  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
  const handleNetworkModalClose = () => {
    setIsNetworkModalOpen(false)
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
          <Box alignItems="flex-start" justifyContent="flex-start" marginTop="8">
            <Text variant="large" color="text80" marginBottom="4">
              Coins
            </Text>
            <Box flexDirection="column" gap="4">
              {isFetchingBalances && (
                <Box marginTop="4" alignItems="center" justifyContent="center">
                  <Spinner size="lg" />
                </Box>
              )}
              {balances.map(balance => (
                <TokenBalanceItem key={balance.contractAddress + balance.chainId} tokenBalance={balance} />
              ))}
            </Box>
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
