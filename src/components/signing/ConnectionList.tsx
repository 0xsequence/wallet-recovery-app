import { Card, CloseIcon, ExternalLinkIcon, IconButton, Text } from '@0xsequence/design-system'
import { SessionTypes } from '@walletconnect/types'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

import { ExternalIcon } from '~/components/misc/ExternalIcon'

export default function ConnectionList({ sessionList }: { sessionList: SessionTypes.Struct[] }) {
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  return (
    <>
      {sessionList.map((session, index) => (
        <Card key={index} className='flex flex-row justify-between items-center gap-2'>
          <div className='flex flex-row items-center gap-4'>
            <ExternalIcon src={session.peer.metadata.icons[0]} />

            <Text variant="normal" fontWeight="bold" color="text100">
              {!session.peer.metadata.name ? session.peer.metadata.url : session.peer.metadata.name}
            </Text>
          </div>

          <div className='flex flex-row gap-2'>
            {session.peer.metadata.url && (
              <IconButton
                icon={ExternalLinkIcon}
                size="sm"
                shape="square"
                onClick={() => window.open(session.peer.metadata.url!, '_blank')}
              />
            )}
            <IconButton
              icon={CloseIcon}
              size="sm"
              shape="square"
              onClick={() => walletConnectSignClientStore.disconnectSession(session.topic)}
            />
          </div>
        </Card>
      ))}
    </>
  )
}
