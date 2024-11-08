import { Box, Button, Divider, TabsContent, TabsHeader, TabsRoot, Text, TextInput } from '@0xsequence/design-system'
import { NetworkType } from '@0xsequence/network'
import { ChangeEvent, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

import AddNetwork from './AddNetwork'
import NetworkItem from './NetworkItem'

export default function Networks() {
  const networkStore = useStore(NetworkStore)

  const networks = useObservable(networkStore.networks)
  const mainnets = networks.filter(network => network.type === NetworkType.MAINNET)

  const userAdditions = useObservable(networkStore.userAdditionNetworkChainIds)
  // Move user additions to top
  const sortedMainnets = mainnets.sort((a, _) => (userAdditions.includes(a.chainId) ? -1 : 1))

  const testnets = networks.filter(network => network.type === NetworkType.TESTNET)

  const arweaveGatewayUrl = useObservable(networkStore.arweaveGatewayUrl)
  const arweaveGraphqlUrl = useObservable(networkStore.arweaveGraphqlUrl)

  const [selectedNetworkType, setSelectedNetworkType] = useState<NetworkType | 'arweave'>(NetworkType.MAINNET)

  const [isAddNetworkActive, setIsAddNetworkActive] = useState(false)

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
                { label: 'Test Networks', value: NetworkType.TESTNET },
                { label: 'Arweave', value: 'arweave' }
              ]}
            />
          </Box>

          <TabsContent value={NetworkType.MAINNET}>
            <Box flexDirection="column" gap="2">
              <Box width="full" flexDirection="column" alignItems="flex-end" marginY="4">
                <Button
                  label="Add network"
                  variant="primary"
                  size="md"
                  shape="square"
                  onClick={() => {
                    setIsAddNetworkActive(true)
                  }}
                />
                {isAddNetworkActive && <AddNetwork onClose={() => setIsAddNetworkActive(false)} />}
              </Box>
              <>
                {sortedMainnets.map((network, i) => (
                  <NetworkItem key={i} network={network} />
                ))}
              </>
            </Box>
          </TabsContent>

          <TabsContent value={NetworkType.TESTNET}>
            <Box flexDirection="column" gap="2">
              {testnets.map((network, i) => (
                <NetworkItem key={i} network={network} />
              ))}
            </Box>
          </TabsContent>

          <TabsContent value="arweave">
            <Box flexDirection="column" gap="2">
              <Text fontWeight="bold" color="text100">
                Arweave
              </Text>
              <TextInput
                label="Gateway URL"
                labelLocation="left"
                name="arweaveGatewayUrl"
                spellCheck={false}
                value={arweaveGatewayUrl ?? ''}
                onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                  networkStore.arweaveGatewayUrl.set(ev.target.value)
                }}
              />
              <TextInput
                label="GraphQL URL"
                labelLocation="left"
                name="arweaveGraphqlUrl"
                spellCheck={false}
                value={arweaveGraphqlUrl ?? ''}
                onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                  networkStore.arweaveGraphqlUrl.set(ev.target.value)
                }}
              />
              <Divider />
            </Box>
          </TabsContent>
        </TabsRoot>
      </Box>
    </Box>
  )
}
