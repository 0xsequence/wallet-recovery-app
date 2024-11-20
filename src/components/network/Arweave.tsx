import { Box, Divider, Text, TextInput } from '@0xsequence/design-system'
import { useObservable } from 'micro-observables'
import { ChangeEvent } from 'react'

import { useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

export default function Arweave() {
  const networkStore = useStore(NetworkStore)

  const arweaveGatewayUrl = useObservable(networkStore.arweaveGatewayUrl)
  const arweaveGraphqlUrl = useObservable(networkStore.arweaveGraphqlUrl)
  return (
    <Box flexDirection="column" gap="2" paddingTop="6">
      <Box flexDirection="column" gap="1">
        <Text variant="normal" fontWeight="medium" color="text100">
          Gateway URL
        </Text>
        <TextInput
          name="arweaveGatewayUrl"
          spellCheck={false}
          value={arweaveGatewayUrl ?? ''}
          onChange={(ev: ChangeEvent<HTMLInputElement>) => {
            networkStore.arweaveGatewayUrl.set(ev.target.value)
          }}
        />
      </Box>
      <Box flexDirection="column" gap="1">
        <Text variant="normal" fontWeight="medium" color="text100">
          GraphQL URL
        </Text>
        <TextInput
          name="arweaveGatewayUrl"
          spellCheck={false}
          value={arweaveGatewayUrl ?? ''}
          onChange={(ev: ChangeEvent<HTMLInputElement>) => {
            networkStore.arweaveGatewayUrl.set(ev.target.value)
          }}
        />
      </Box>
    </Box>
  )
}
