import { Box, Button, Divider, TabsContent, TabsPrimitive, Text, TextInput } from '@0xsequence/design-system'
import { NetworkType } from '@0xsequence/network'
import { ChangeEvent, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

import AddNetwork from './AddNetwork'
import NetworkItem from './network/NetworkItem'

export default function Networks() {
  const networkStore = useStore(NetworkStore)

  const networks = useObservable(networkStore.networks)
  const mainnets = networks.filter(network => network.type === NetworkType.MAINNET)

  const userAdditions = useObservable(networkStore.userAdditionNetworkChainIds)
  // TODO: Move user additions to top
  const sortedMainnets = mainnets.sort((a, _) => (userAdditions.includes(a.chainId) ? -1 : 1))

  const testnets = networks.filter(network => network.type === NetworkType.TESTNET)

  const arweaveGatewayUrl = useObservable(networkStore.arweaveGatewayUrl)
  const arweaveGraphqlUrl = useObservable(networkStore.arweaveGraphqlUrl)

  const [selectedNetworkType, setSelectedNetworkType] = useState<NetworkType | 'arweave'>(NetworkType.MAINNET)

  const [isAddNetworkActive, setIsAddNetworkActive] = useState(false)

  return (
    <Box flexDirection="column" padding="6" gap="6">
      <Text variant="xlarge" color="text100">
        Networks
      </Text>

      <TabsPrimitive.Root
        value={selectedNetworkType}
        onValueChange={value => setSelectedNetworkType(value as NetworkType)}
      >
        <Box>
          <TabsPrimitive.TabsList>
            <Box flexDirection="row" style={{ height: '32px' }}>
              <TabsPrimitive.TabsTrigger
                value={NetworkType.MAINNET}
                style={{
                  backgroundColor: 'inherit',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Text
                  variant="medium"
                  fontWeight="semibold"
                  color={selectedNetworkType === NetworkType.MAINNET ? 'text100' : 'text50'}
                  paddingX="4"
                >
                  Mainnets
                </Text>
                {selectedNetworkType === NetworkType.MAINNET ? (
                  <Divider color="white" height="0.5" position="relative" style={{ bottom: '10px' }} />
                ) : (
                  <Divider position="relative" style={{ bottom: '10px' }} />
                )}
              </TabsPrimitive.TabsTrigger>

              <TabsPrimitive.TabsTrigger
                value={NetworkType.TESTNET}
                style={{
                  backgroundColor: 'inherit',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Text
                  variant="medium"
                  fontWeight="semibold"
                  color={selectedNetworkType === NetworkType.TESTNET ? 'text100' : 'text50'}
                  paddingX="4"
                >
                  Testnets
                </Text>
                {selectedNetworkType === NetworkType.TESTNET ? (
                  <Divider color="white" height="0.5" position="relative" style={{ bottom: '10px' }} />
                ) : (
                  <Divider position="relative" style={{ bottom: '10px' }} />
                )}
              </TabsPrimitive.TabsTrigger>

              <TabsPrimitive.TabsTrigger
                value="arweave"
                style={{
                  backgroundColor: 'inherit',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Text
                  variant="medium"
                  fontWeight="semibold"
                  color={selectedNetworkType === 'arweave' ? 'text100' : 'text50'}
                  paddingX="4"
                >
                  Arweave
                </Text>

                {selectedNetworkType === 'arweave' ? (
                  <Divider color="white" height="0.5" position="relative" style={{ bottom: '10px' }} />
                ) : (
                  <Divider position="relative" style={{ bottom: '10px' }} />
                )}
              </TabsPrimitive.TabsTrigger>

              <Box flexGrow="1">
                <Divider position="relative" marginY="0" style={{ top: '30px' }} />
              </Box>
            </Box>
          </TabsPrimitive.TabsList>

          <TabsContent value={NetworkType.MAINNET}>
            <Box flexDirection="column" gap="3" paddingTop="6">
              {/* <Box width="full" flexDirection="column" alignItems="flex-end" marginY="4">
                {!isAddNetworkActive ? (
                  <Button
                    label="Add network"
                    variant="primary"
                    size="md"
                    shape="square"
                    onClick={() => {
                      setIsAddNetworkActive(true)
                    }}
                  />
                ) : (
                  <AddNetwork onClose={() => setIsAddNetworkActive(false)} />
                )}
              </Box> */}
              {sortedMainnets.map((network, i) => (
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
        </Box>
      </TabsPrimitive.Root>
    </Box>
  )
}
