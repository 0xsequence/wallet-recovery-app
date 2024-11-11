import { Box, Card, CloseIcon, ExternalLinkIcon, IconButton, Image, Text } from '@0xsequence/design-system'
import { SessionTypes } from '@walletconnect/types'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

export default function ConnectionList({ sessionList }: { sessionList: SessionTypes.Struct[] }) {
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  return (
    <Box flexDirection="column" gap="2">
      {sessionList.length !== 0 && (
        <Text variant="large" color="text80" marginTop="6" marginBottom="2">
          Connected dapps via WalletConnect
        </Text>
      )}

      {sessionList.map((session, index) => (
        <Card key={index} flexDirection="row" alignItems="center" gap="2" padding="2">
          <Image width="8" height="8" src={session.peer.metadata.icons[0]} />
          <Text variant="normal" fontWeight="bold" color="text100">
            {session.peer.metadata.name === '' || !session.peer.metadata.name
              ? session.peer.metadata.url
              : session.peer.metadata.name}
          </Text>
          <Box gap="2" marginLeft="auto">
            {session.peer.metadata.url && (
              <IconButton
                size="xs"
                icon={ExternalLinkIcon}
                onClick={() => window.open(session.peer.metadata.url!, '_blank')}
              />
            )}
            <IconButton
              size="xs"
              icon={CloseIcon}
              onClick={() => {
                walletConnectSignClientStore.disconnectSession(session.topic)
              }}
            />
          </Box>
        </Card>
      ))}
    </Box>
  )
}
