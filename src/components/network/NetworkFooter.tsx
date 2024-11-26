import { AddIcon, Box, Button, Divider } from '@0xsequence/design-system'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

export default function NetworkFooter() {
  const networkStore = useStore(NetworkStore)
  const unsavedNetworkEditChainIds = useObservable(networkStore.unsavedNetworkEditChainIds)
  const unsavedArweaveURLs = useObservable(networkStore.unsavedArweaveURLs)

  return (
    <Box flexDirection="column" width="full" position="absolute" bottom="0" background="backgroundPrimary">
      <Divider marginY="0" />
      <Box alignSelf="flex-end" padding="5" gap="2">
        <Button
          leftIcon={AddIcon}
          label="Add Network"
          shape="square"
          onClick={() => networkStore.isAddingNetwork.set(true)}
        ></Button>
        <Button
          label="Confirm"
          variant="primary"
          shape="square"
          disabled={
            unsavedNetworkEditChainIds.length === 0 && !Object.values(unsavedArweaveURLs || {}).length
          }
          onClick={() => networkStore.saveUnsavedNetworkEdits()}
        />
      </Box>
    </Box>
  )
}
