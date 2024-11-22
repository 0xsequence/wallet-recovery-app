import { Box, Text, TextInput } from '@0xsequence/design-system'
import { ChangeEvent, useEffect, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

export default function Arweave() {
  const networkStore = useStore(NetworkStore)

  const [gatewayUrl, setGatewayUrl] = useState(networkStore.arweaveGatewayUrl.get())
  const [graphQLUrl, setGraphQLUrl] = useState(networkStore.arweaveGraphqlUrl.get())

  const isUnsaved = Object.values(useObservable(networkStore.unsavedArweaveURLs) || {}).length > 0

  useEffect(() => {
    if (
      gatewayUrl &&
      graphQLUrl &&
      (gatewayUrl !== networkStore.arweaveGatewayUrl.get() ||
        graphQLUrl !== networkStore.arweaveGraphqlUrl.get() ||
        isUnsaved)
    ) {
      networkStore.addUnsavedArweaveURLs(gatewayUrl, graphQLUrl)
    }
  }, [gatewayUrl, graphQLUrl])

  return (
    <Box flexDirection="column" gap="2" paddingTop="6">
      <Box flexDirection="column" gap="1">
        <Text variant="normal" fontWeight="medium" color="text100">
          Gateway URL
        </Text>
        <TextInput
          name="arweaveGatewayUrl"
          spellCheck={false}
          value={gatewayUrl ?? ''}
          onChange={(ev: ChangeEvent<HTMLInputElement>) => {
            setGatewayUrl(ev.target.value)
          }}
        />
      </Box>
      <Box flexDirection="column" gap="1">
        <Text variant="normal" fontWeight="medium" color="text100">
          GraphQL URL
        </Text>
        <TextInput
          name="arweaveGraphqlUrl"
          spellCheck={false}
          value={graphQLUrl ?? ''}
          onChange={(ev: ChangeEvent<HTMLInputElement>) => {
            setGraphQLUrl(ev.target.value)
          }}
        />
      </Box>
    </Box>
  )
}
