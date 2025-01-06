import {
  AddIcon,
  Box,
  Button,
  Card,
  Divider,
  Image,
  Modal,
  Spinner,
  Text,
  useMediaQuery
} from '@0xsequence/design-system'
import { useMemo, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { CollectibleStore } from '~/stores/CollectibleStore'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import { NetworkStore } from '~/stores/NetworkStore'

import CollectionIcon from '~/assets/icons/collection.svg'

import CollectibleBalanceItem from './CollectibleBalanceItem'
import ImportCollectible from './ImportCollectible'

export default function CollectibleList({
  onSendClick
}: {
  onSendClick: (collectibleInfo: CollectibleInfo) => void
}) {
  const isMobile = useMediaQuery('isMobile')

  const collectibleStore = useStore(CollectibleStore)
  const networkStore = useStore(NetworkStore)

  const isFetchingBalances = useObservable(collectibleStore.isFetchingBalances)
  const userCollectibles = useObservable(collectibleStore.userCollectibles)

  const collectibles = useMemo(() => userCollectibles, [userCollectibles])
  const filteredCollectibles = useMemo(() => {
    return collectibles.filter(collectibleInfo => {
      return !networkStore.networks
        .get()
        .find(network => network.chainId === collectibleInfo.collectibleInfoParams.chainId)?.disabled
    })
  }, [collectibles, networkStore])

  const [isImportCollectibleViewOpen, setIsImportCollectibleViewOpen] = useState(false)

  return (
    <Box width="full">
      <Box justifyContent="space-between" alignItems="center">
        <Box alignItems="center" gap="2">
          <Image src={CollectionIcon} width="5" height="5" />

          <Text variant="normal" fontWeight="bold" color="text100">
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
            {filteredCollectibles.length > 0 ? (
              <>
                {collectibles.map(collectibleInfo => {
                  return (
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
                  )
                })}
              </>
            ) : (
              <Card flexDirection="column">
                <Text textAlign="center" variant="normal" color="text50" padding="4">
                  Import ERC721 or ERC1155 Collectibles
                </Text>
              </Card>
            )}
          </>
        )}
      </Box>

      {isImportCollectibleViewOpen && (
        <Modal
          size="lg"
          onClose={() => setIsImportCollectibleViewOpen(false)}
          contentProps={{
            style: {
              scrollbarColor: 'gray black',
              scrollbarWidth: 'thin',
              width: !isMobile ? '800px' : '100%',
              minHeight: 'auto',
              maxHeight: '80%',
              overflow: 'hidden'
            }
          }}
        >
          <ImportCollectible onClose={() => setIsImportCollectibleViewOpen(false)} />
        </Modal>
      )}
    </Box>
  )
}
