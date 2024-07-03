import { Box, Card, Divider, Text } from '@0xsequence/design-system'

import { EIP1193Provider, useSyncProviders } from '~/hooks/useSyncProviders'

export default function SelectProvider({
  onSelectProvider
}: {
  onSelectProvider: (provider: EIP1193Provider) => void
}) {
  const providers = useSyncProviders()

  return (
    <Box flexDirection="column" paddingY="5" alignItems="center">
      <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
        Select an external wallet to send transactions
      </Text>
      <Divider color="gradientPrimary" width="full" height="px" />
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
