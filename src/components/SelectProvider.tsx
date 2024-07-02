import { Box, Card, Text } from '@0xsequence/design-system'

import { EIP1193Provider, useSyncProviders } from '~/hooks/useSyncProviders'

export default function SelectProvider({
  onSelectProvider
}: {
  onSelectProvider: (provider: EIP1193Provider) => void
}) {
  const providers = useSyncProviders()

  return (
    <Box flexDirection="column" gap="2" paddingX="16" paddingY="4" marginBottom="4" alignItems="center">
      <Text variant="large" color="text100">
        Select an external wallet to send transactions
      </Text>
      <Box flexDirection="column" gap="4" padding="8">
        {providers.map(provider => (
          <Card
            key={provider.info.uuid}
            flexDirection="row"
            alignItems="center"
            gap="2"
            cursor="pointer"
            background={{ base: 'buttonGlass', hover: 'backgroundSecondary' }}
            onClick={() => onSelectProvider(provider.provider)}
          >
            <Box flexDirection="row" alignItems="center" gap="2">
              <img
                src={provider.info.icon}
                alt={provider.info.name}
                style={{ width: '20px', height: '20px' }}
              />
              <Text variant="normal" color="text100">
                {provider.info.name}
              </Text>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
