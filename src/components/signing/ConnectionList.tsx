import { Box, Card, CloseIcon, ExternalLinkIcon, Text } from '@0xsequence/design-system'
import { SessionTypes } from '@walletconnect/types'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

import { ButtonWithIcon } from '~/components/misc/ButtonWithIcon'
import { ExternalIcon } from '~/components/misc/ExternalIcon'

export default function ConnectionList({ sessionList }: { sessionList: SessionTypes.Struct[] }) {
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  return (
    <>
      {sessionList.map((session, index) => (
        <Card key={index} flexDirection="row" justifyContent="space-between" alignItems="center" gap="2">
          <Box alignItems="center" gap="4">
            <ExternalIcon background="text80" src={session.peer.metadata.icons[0]} />

            <Text variant="normal" fontWeight="bold" color="text100">
              {!!!session.peer.metadata.name ? session.peer.metadata.url : session.peer.metadata.name}
            </Text>
          </Box>

          <Box gap="2">
            {session.peer.metadata.url && (
              <ButtonWithIcon
                icon={<ExternalLinkIcon color="text100" />}
                onClick={() => window.open(session.peer.metadata.url!, '_blank')}
              />
            )}
            <ButtonWithIcon
              icon={<CloseIcon color="text100" />}
              onClick={() => walletConnectSignClientStore.disconnectSession(session.topic)}
            />
          </Box>
        </Card>
      ))}
    </>
  )
}
