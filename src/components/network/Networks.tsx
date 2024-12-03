import { Box, TabsContent, TabsPrimitive } from '@0xsequence/design-system'
import { NetworkType } from '@0xsequence/network'
import { useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

import AddNetwork from './AddNetwork'
import Arweave from './Arweave'
import NetworkFooter from './NetworkFooter'
import NetworkHeader from './NetworkHeader'
import NetworkList from './NetworkList'

export default function Networks() {
  const networkStore = useStore(NetworkStore)
  const networks = useObservable(networkStore.networks)
  const userAdditions = useObservable(networkStore.userAdditionNetworkChainIds)
  const isAddingNetwork = useObservable(networkStore.isAddingNetwork)

  const mainnets = networks.filter(network => network.type === NetworkType.MAINNET)

  const sortedMainnets = mainnets.sort((a, _) => (userAdditions.includes(a.chainId) ? -1 : 1))

  const testnets = networks.filter(network => network.type === NetworkType.TESTNET)

  const [selectedNetworkType, setSelectedNetworkType] = useState<NetworkType | 'arweave'>(NetworkType.MAINNET)

  return (
    <Box flexDirection="column">
      {!isAddingNetwork ? (
        <Box flexDirection="column" justifyContent="space-between">
          <TabsPrimitive.Root
            value={selectedNetworkType}
            onValueChange={value => setSelectedNetworkType(value as NetworkType)}
          >
            <NetworkHeader selectedNetworkType={selectedNetworkType} />

            <Box paddingX="6" style={{ marginTop: '108px', marginBottom: '85px' }}>
              <TabsContent value={NetworkType.MAINNET}>
                <NetworkList networks={sortedMainnets} />
              </TabsContent>

              <TabsContent value={NetworkType.TESTNET}>
                <NetworkList networks={testnets} />
              </TabsContent>

              <TabsContent value="arweave">
                <Arweave />
              </TabsContent>
            </Box>
          </TabsPrimitive.Root>
          <NetworkFooter />
        </Box>
      ) : (
        <AddNetwork onClose={() => networkStore.isAddingNetwork.set(false)} />
      )}
    </Box>
  )
}
