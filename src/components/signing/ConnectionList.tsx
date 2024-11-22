import { Box, Card, CloseIcon, ExternalLinkIcon, IconButton, Image, Text } from '@0xsequence/design-system'
import { SessionTypes } from '@walletconnect/types'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

import { ExternalIcon } from '../helpers/ExternalIcons'

export default function ConnectionList({ sessionList }: { sessionList: SessionTypes.Struct[] }) {
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  return (
    <>
      {sessionList.map((session, index) => (
        <Card key={index} flexDirection="row" justifyContent="space-between" alignItems="center" gap="2">
          <Box alignItems="center" gap="4">
            <ExternalIcon src={session.peer.metadata.icons[0]} />

            <Text variant="medium" color="text100">
              {!!!session.peer.metadata.name ? session.peer.metadata.url : session.peer.metadata.name}
            </Text>
          </Box>

          <Box gap="2">
            {session.peer.metadata.url && (
              <Box
                justifyContent="center"
                alignItems="center"
                background="backgroundMuted"
                borderRadius="sm"
                height="9"
                width="9"
                cursor="pointer"
                onClick={() => window.open(session.peer.metadata.url!, '_blank')}
              >
                <ExternalLinkIcon color="text100" />
              </Box>
            )}
            <Box
              justifyContent="center"
              alignItems="center"
              background="backgroundMuted"
              borderRadius="sm"
              height="9"
              width="9"
              cursor="pointer"
              onClick={() => walletConnectSignClientStore.disconnectSession(session.topic)}
            >
              <CloseIcon color="text100" />
            </Box>
          </Box>
        </Card>
      ))}
    </>
  )
}
