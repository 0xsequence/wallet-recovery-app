import { useState } from 'react'
import {
  Box,
  Button,
  Divider,
  TabsContent,
  TabsHeader,
  TabsRoot,
  Text,
  TextInput
} from '@0xsequence/design-system'
import { NetworkType } from '@0xsequence/network'

import { useObservable, useStore } from '../stores'
import { NetworkStore } from '../stores/NetworkStore'

import NetworkItem from './NetworkItem'

function Networks() {
  const networkStore = useStore(NetworkStore)

  const networks = useObservable(networkStore.networks)
  const mainnets = networks.filter(network => network.type === NetworkType.MAINNET)
  const testnets = networks.filter(network => network.type === NetworkType.TESTNET)

  const [selectedNetworkType, setSelectedNetworkType] = useState<NetworkType>(NetworkType.MAINNET)

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
                { label: 'Test Networks', value: NetworkType.TESTNET }
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
                <>
                  {isAddNetworkActive && (
                    <Box flexDirection="column" width="full" marginTop="4" gap="4">
                      <TextInput width="full" label="Chain ID" labelLocation="left" name="chainId" />
                      <TextInput width="full" label="Network Name" labelLocation="left" name="networkName" />
                      <TextInput width="full" label="RPC URL" labelLocation="left" name="rpcUrl" />
                      <TextInput width="full" label="Block explorer URL" labelLocation="left" name="rpcUrl" />
                      <Box alignItems="center" justifyContent="flex-end" gap="8" marginTop="4">
                        <Button
                          label="Cancel"
                          variant="text"
                          size="md"
                          shape="square"
                          onClick={() => setIsAddNetworkActive(false)}
                        />
                        <Button
                          label="Add"
                          variant="primary"
                          size="md"
                          shape="square"
                          onClick={() => setIsAddNetworkActive(false)}
                        />
                      </Box>
                      <Divider />
                    </Box>
                  )}
                </>
              </Box>
              <>
                {mainnets.map((network, i) => (
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
        </TabsRoot>
      </Box>
    </Box>
  )
}

export default Networks
