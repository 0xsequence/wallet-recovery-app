import { AddIcon, Button, Text } from '@0xsequence/design-system'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

export default function NetworkFooter() {
  const networkStore = useStore(NetworkStore)
  const unsavedNetworkEditChainIds = useObservable(networkStore.unsavedNetworkEditChainIds)
  const unsavedArweaveURLs = useObservable(networkStore.unsavedArweaveURLs)

  return (
    <div className='flex flex-col w-full absolute bottom-0 bg-background-primary'>
      <div className='h-0.5 bg-backgroundBackdrop' />
      <div className='flex flex-row justify-end items-center gap-2 p-5'>
        <Button
          shape="square"
          onClick={() => networkStore.isAddingNetwork.set(true)}
        >
          <AddIcon />
          <Text variant="normal" fontWeight="medium" color="text100">Add Network</Text>
        </Button>
        <Button
          variant="primary"
          shape="square"
          disabled={
            unsavedNetworkEditChainIds.length === 0 && !Object.values(unsavedArweaveURLs || {}).length
          }
          onClick={() => networkStore.saveUnsavedNetworkEdits()}
        >
          <Text variant="normal" fontWeight="medium" color="text100">Confirm</Text>
        </Button>
      </div>
    </div>
  )
}
