import { AddIcon, Box, Button, Modal, Spinner } from '@0xsequence/design-system'
import { useMemo, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { CollectibleStore } from '~/stores/CollectibleStore'
import { CollectibleInfo } from '~/stores/CollectibleStore'

import CollectibleBalanceItem from './CollectibleBalanceItem'
import ImportCollectible from './ImportCollectible'

export default function CollectibleList({
  onSendClick
}: {
  onSendClick: (collectibleInfo: CollectibleInfo) => void
}) {
  const collectibleStore = useStore(CollectibleStore)

  const isFetchingBalances = useObservable(collectibleStore.isFetchingBalances)
  const userCollectibles = useObservable(collectibleStore.userCollectibles)

  const collectibles = useMemo(() => userCollectibles, [userCollectibles])

  const [isImportCollectibleViewOpen, setIsImportCollectibleViewOpen] = useState(false)

  return (
    <>
      <Box width="full" flexDirection="row" flexWrap="wrap" gap="4" marginBottom="8">
        {collectibles.map(collectibleInfo => (
          <Box
            key={
              collectibleInfo.collectibleInfoParams.chainId +
              collectibleInfo.collectibleInfoParams.address +
              collectibleInfo.collectibleInfoParams.tokenId
            }
            width="1/3"
          >
            <CollectibleBalanceItem
              collectibleInfo={collectibleInfo}
              onSendClick={() => {
                onSendClick(collectibleInfo)
              }}
              onRemoveClick={() => {
                collectibleStore.removeCollectible(collectibleInfo)
              }}
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
          <Modal size="sm" onClose={() => setIsImportCollectibleViewOpen(false)}>
            <ImportCollectible onClose={() => setIsImportCollectibleViewOpen(false)} />
          </Modal>
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
