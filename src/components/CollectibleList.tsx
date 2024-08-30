import { AddIcon, Box, Button, Spinner } from '@0xsequence/design-system'
import { useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { CollectibleStore } from '~/stores/CollectibleStore'

import CollectibleBalanceItem from './CollectibleBalanceItem'
import ImportCollectible from './ImportCollectible'

export default function CollectibleList() {
  const collectibleStore = useStore(CollectibleStore)

  const isFetchingBalances = useObservable(collectibleStore.isFetchingBalances)
  const userCollectibles = useObservable(collectibleStore.userCollectibles)

  const [isImportCollectibleViewOpen, setIsImportCollectibleViewOpen] = useState(false)

  return (
    <>
      <Box width="full" flexDirection="row" gap="4" marginBottom="8">
        {userCollectibles.map(({ infoParams, infoResponse }) => (
          <Box key={infoParams.chainId + infoParams.address + infoParams.tokenId} width="1/3">
            <CollectibleBalanceItem
              collectibleInfoParams={infoParams}
              collectibleInfoResponse={infoResponse}
              onSendClick={() => {}}
            />
          </Box>
        ))}
        {isFetchingBalances && (
          <Box marginTop="4" alignItems="center" justifyContent="center">
            <Spinner size="lg" />
          </Box>
        )}
      </Box>
      <Box width="full" flexDirection="column" alignItems="center" justifyContent="center" marginBottom="4">
        {isImportCollectibleViewOpen && (
          <ImportCollectible onClose={() => setIsImportCollectibleViewOpen(false)} />
        )}
        <Button
          label="Import collectible"
          leftIcon={AddIcon}
          variant="primary"
          size="md"
          shape="square"
          onClick={() => {
            setIsImportCollectibleViewOpen(true)
          }}
        />
      </Box>
    </>
  )
}
