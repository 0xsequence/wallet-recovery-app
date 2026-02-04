import {
  AddIcon,
  Button,
  Card,
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
import { WalletStore } from '~/stores/WalletStore'

export default function CollectibleList({
  onSendClick
}: {
  onSendClick: (collectibleInfo: CollectibleInfo) => void
}) {
  const isMobile = useMediaQuery('isMobile')

  const collectibleStore = useStore(CollectibleStore)
  const networkStore = useStore(NetworkStore)
  const walletStore = useStore(WalletStore)

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
  const isConnected = useObservable(walletStore.selectedExternalProvider) !== undefined

  const [isImportCollectibleViewOpen, setIsImportCollectibleViewOpen] = useState(false)

  return (
    <div className='w-full mb-5'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3'>
        <div className='flex flex-row items-center gap-2'>
          <img src={CollectionIcon} alt="Collectibles" className='w-4 h-4' />

          <Text variant="normal" fontWeight="bold" color="text100">
            Collectibles
          </Text>
        </div>
        <Button
          size="sm"
          shape="square"
          onClick={() => setIsImportCollectibleViewOpen(true)}
          className='w-full sm:w-auto'
        >
          <AddIcon />
          Import
        </Button>
      </div>

      <div className='h-0 my-2' />

      <div className='flex flex-col gap-2'>
        {isFetchingBalances ? (
          <div className='flex flex-row items-center justify-center mt-4'>
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {filteredCollectibles.length > 0 ? (
              <>
                {collectibles.map(collectibleInfo => {
                  return (
                    <div
                      key={
                        collectibleInfo.collectibleInfoParams.chainId +
                        collectibleInfo.collectibleInfoParams.address +
                        collectibleInfo.collectibleInfoParams.tokenId
                      }
                    >
                      <CollectibleBalanceItem
                        disabled={!isConnected}
                        collectibleInfo={collectibleInfo}
                        onSendClick={() => {
                          onSendClick(collectibleInfo)
                        }}
                      />
                    </div>
                  )
                })}
              </>
            ) : (
              <Card className='flex flex-col'>
                <Text variant="normal" color="text50" className='text-center p-4'>
                  Import ERC721 or ERC1155 Collectibles
                </Text>
              </Card>
            )}
          </>
        )}
      </div>

      {isImportCollectibleViewOpen && (
        <Modal
          size="lg"
          onClose={() => setIsImportCollectibleViewOpen(false)}
          contentProps={{
            style: {
              scrollbarColor: 'gray black',
              scrollbarWidth: 'thin',
              width: '100%',
              maxWidth: !isMobile ? '800px' : '100%',
              minHeight: 'auto',
              maxHeight: !isMobile ? '80%' : '90%',
              overflow: 'hidden'
            }
          }}
        >
          <ImportCollectible onClose={() => setIsImportCollectibleViewOpen(false)} />
        </Modal>
      )}
    </div>
  )
}
