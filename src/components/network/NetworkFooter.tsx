import { AddIcon, Box, Button, Divider } from '@0xsequence/design-system'
import { useEffect, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

export default function NetworkFooter() {
  const networkStore = useStore(NetworkStore)
  const unsavedNetworkEditChainIds = useObservable(networkStore.unsavedNetworkEditChainIds)

  return (
    <Box flexDirection="column" width="full" position="absolute" bottom="0" background="backgroundPrimary">
      <Divider marginY="0" />
      <Box alignSelf="flex-end" padding="5" gap="2">
        <Button leftIcon={AddIcon} label="Add Network" shape="square"></Button>
        <Button
          label="Confirm"
          variant="primary"
          shape="square"
          disabled={unsavedNetworkEditChainIds.length === 0}
          onClick={() => networkStore.saveUnsavedNetworkEdits()}
        />
      </Box>
    </Box>
  )
}
