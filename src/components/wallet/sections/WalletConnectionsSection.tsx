import { Box, Text } from '@0xsequence/design-system'
import DappList from '~/components/wallet/dapps/DappList'
import ExternalWallet from '~/components/wallet/externalprovider/ExternalWallet'

/**
 * Section displaying external wallet connections and connected dApps
 */
export function WalletConnectionsSection() {
  return (
    <Box flexDirection="column" gap="5">
      <Text variant="small" fontWeight="bold" color="text50">
        External connections
      </Text>

      <ExternalWallet />

      <DappList />
    </Box>
  )
}
