import { Box, TabsContent, TabsHeader, TabsRoot, Text } from '@0xsequence/design-system'

import { useObservable, useStore } from '../stores'
import { NetworkStore } from '../stores/NetworkStore'
import { useState } from 'react'
import { NetworkType } from '@0xsequence/network'
import NetworkItem from './NetworkItem'

function Networks() {
  const networkStore = useStore(NetworkStore)

  const networks = useObservable(networkStore.networks)
  const mainnets = networks.filter(network => network.type === NetworkType.MAINNET)
  const testnets = networks.filter(network => network.type === NetworkType.TESTNET)

  const [selectedNetworkType, setSelectedNetworkType] = useState<NetworkType>(NetworkType.MAINNET)

  return (
    <Box
      flexDirection="column"
      paddingY="4"
      paddingX="8"
      background="backgroundPrimary"
      width="full"
      height="full"
      alignItems="center"
    >
      <Box>
        <Text variant="large" color="text80">
          Networks
        </Text>
      </Box>

      <Box width="full" marginTop="4" paddingBottom="4">
        <TabsRoot
          value={selectedNetworkType}
          onValueChange={value => setSelectedNetworkType(value as NetworkType)}
        >
          <Box marginBottom="10">
            <TabsHeader
              value={selectedNetworkType}
              tabs={[
                { label: 'Networks', value: NetworkType.MAINNET },
                { label: 'Test Networks', value: NetworkType.TESTNET }
              ]}
            />
          </Box>

          <TabsContent value={NetworkType.MAINNET}>
            <Box flexDirection="column" gap="2">
              {mainnets.map((network, i) => (
                <NetworkItem key={i} network={network} />
              ))}
            </Box>
          </TabsContent>

          <TabsContent value={NetworkType.TESTNET}>
            <Box flexDirection="column" gap="2">
              {testnets.map((network, i) => (
                <NetworkItem key={i} network={network} />
              ))}
            </Box>
          </TabsContent>
        </TabsRoot>
      </Box>
    </Box>
  )
}

export default Networks
