import { AddIcon, Box, Button, Card, Divider, Image, Modal, Spinner, Text } from '@0xsequence/design-system'
import { useMemo, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { CollectibleStore } from '~/stores/CollectibleStore'
import { CollectibleInfo } from '~/stores/CollectibleStore'

import FilledCheckbox from '~/components/helpers/FilledCheckBox'

import CollectionIcon from '~/assets/icons/collection.svg'

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
    <Box width="full">
      <Box justifyContent="space-between" alignItems="center">
        <Box gap="2">
          <Image src={CollectionIcon} width="7" height="7" />

          <Text variant="large" fontWeight="bold" color="text100">
            Collectibles
          </Text>
        </Box>
        <Button
          size="sm"
          leftIcon={AddIcon}
          label="Import"
          shape="square"
          onClick={() => setIsImportCollectibleViewOpen(true)}
        />
      </Box>

      <Divider marginY="2" />

      <Box width="full" flexDirection="column" gap="4" marginBottom="8">
        {isFetchingBalances ? (
          <Box marginTop="4" alignItems="center" justifyContent="center">
            <Spinner size="lg" />
          </Box>
        ) : (
          <>
            {collectibles.length > 0 ? (
              <>
                {collectibles.map(collectibleInfo => (
                  <Box
                    key={
                      collectibleInfo.collectibleInfoParams.chainId +
                      collectibleInfo.collectibleInfoParams.address +
                      collectibleInfo.collectibleInfoParams.tokenId
                    }
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
              </>
            ) : (
              <Card flexDirection="column">
                <Text alignSelf="center" variant="large" color="text50" padding="4">
                  Import ERC721 or ERC1155 Collectibles
                </Text>
              </Card>
            )}
          </>
        )}
      </Box>

      {isImportCollectibleViewOpen && (
        <Modal size="sm" onClose={() => setIsImportCollectibleViewOpen(false)}>
          <ImportCollectible onClose={() => setIsImportCollectibleViewOpen(false)} />
        </Modal>
      )}
    </Box>
  )
}