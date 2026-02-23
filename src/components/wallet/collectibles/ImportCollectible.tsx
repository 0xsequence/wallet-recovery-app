import {
  Button,
  Checkbox,
  CheckmarkIcon,
  ChevronLeftIcon,
  CloseIcon,
  CollectionIcon,
  FileInput,
  FolderIcon,
  IconButton,
  Modal,
  RefreshIcon,
  SearchIcon,
  Select,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  TextInput,
  useToast
} from '@0xsequence/design-system'
import { NetworkConfig, NetworkType } from '@0xsequence/network'
import { BigNumberish, ethers } from 'ethers'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { isAddress } from 'viem'

import { useObservable, useStore } from '~/stores'
import {
  CollectibleContractType,
  CollectibleContractTypeValues,
  CollectibleInfoResponse,
  CollectibleStore
} from '~/stores/CollectibleStore'
import { NetworkStore } from '~/stores/NetworkStore'

export default function ImportCollectible({ onClose }: { onClose: () => void }) {
  const networkStore = useStore(NetworkStore)
  const networks = networkStore.networks.get()
  const mainnetNetworks = networks.filter(network => network.type === NetworkType.MAINNET)

  const collectibleStore = useStore(CollectibleStore)
  const isFetchingCollectibleInfo = useObservable(collectibleStore.isFetchingCollectibleInfo)

  const toast = useToast()

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig>(mainnetNetworks[0])
  const [collectibleManualAddress, setCollectibleManualAddress] = useState<string>('')
  const [collectibleManualTokenId, setCollectibleManualTokenId] = useState<number | undefined>()
  const [contractType, setContractType] = useState<CollectibleContractType>(
    CollectibleContractTypeValues.ERC721
  )

  const [isAddingCollection, setIsAddingCollection] = useState(false)
  const [confirmRefreshList, setConfirmRefreshList] = useState(false)

  const [collectionList, setCollectionList] = useState<any[]>([])
  const [collectionListDate, setCollectionListDate] = useState<Date>()
  const [collectionListFilter, setCollectionListFilter] = useState<string>('')
  const [filteredCollectionList, setFilteredCollectionList] = useState<any[]>([])

  const [selectedCollection, setSelectedCollection] = useState<any>()
  const [selectedCollectibles, setSelectedCollectibles] = useState<any[]>([])
  const [queriedCollectibles, setQueriedCollectibles] = useState<any[]>([])
  const [isFetchingQueriedCollectibles, setIsFetchingQueriedCollectibles] = useState(false)

  const [isAddingCollectibleManually, setIsAddingCollectibleManually] = useState(false)
  const [manualCollectibleInfo, setManualCollectibleInfo] = useState<CollectibleInfoResponse | undefined>()
  const [collectibleError, setCollectibleError] = useState<string>('')

  const [queryCollectibleTokenIdsMap, setQueryCollectibleTokenIdsMap] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchCollectibleList = async () => {
      if (selectedNetwork && contractType) {
        try {
          if (contractType === CollectibleContractTypeValues.ERC721) {
            const data = await collectibleStore.getERC721List(selectedNetwork.chainId)
            setCollectionList(data.tokens)
            setCollectionListDate(new Date(data.date))
          } else if (contractType === CollectibleContractTypeValues.ERC1155) {
            const data = await collectibleStore.getERC1155List(selectedNetwork.chainId)
            setCollectionList(data.tokens)
            setCollectionListDate(new Date(data.date))
          }
        } catch {
          setCollectionList([])
          setCollectionListDate(undefined)
        }
      }
    }

    const fetchCollectibleInfo = async () => {
      if (selectedNetwork && contractType && collectibleManualAddress && collectibleManualTokenId) {
        setManualCollectibleInfo(undefined)
        setCollectibleError('')

        if (!isAddress(collectibleManualAddress)) {
          setCollectibleError('Invalid address format')
          return
        }

        try {
          const response = await collectibleStore.getCollectibleInfo({
            chainId: selectedNetwork.chainId,
            address: collectibleManualAddress,
            tokenId: collectibleManualTokenId,
            contractType
          })
          setManualCollectibleInfo(response)
          setCollectibleError('')
        } catch (error: any) {
          console.error('Error fetching collectible info:', error)
          setManualCollectibleInfo(undefined)

          const errorMessage = error.message || 'Unable to fetch collectible information'
          setCollectibleError(errorMessage)
        }
      } else {
        setManualCollectibleInfo(undefined)
        setCollectibleError('')
      }
    }

    fetchCollectibleList()
    fetchCollectibleInfo()
  }, [selectedNetwork, contractType, collectibleManualAddress, collectibleManualTokenId])

  useEffect(() => {
    const fetchQueriedCollectibles = async () => {
      setQueriedCollectibles([])
      if (!queryCollectibleTokenIdsMap[selectedCollection.address]) {
        return
      }

      setIsFetchingQueriedCollectibles(true)
      const tokenIds = queryCollectibleTokenIdsMap[selectedCollection.address].split(',').map(Number)

      for (const tokenId of tokenIds) {
        try {
          const collectibleInfo = await collectibleStore.getCollectibleInfo({
            chainId: selectedNetwork.chainId,
            contractType,
            address: selectedCollection.address,
            tokenId: tokenId
          })

          // TODO: potential improvement to show user that the collectible is not owned

          if (collectibleInfo.isOwner) {
            setQueriedCollectibles(prev => [
              ...prev,
              {
                collectibleInfo,
                chainId: selectedNetwork.chainId,
                contractType,
                address: selectedCollection.address,
                tokenId
              }
            ])
          }
        } catch (error) {
          console.error(error)
          continue
        }
      }
      setIsFetchingQueriedCollectibles(false)
    }

    fetchQueriedCollectibles()
  }, [queryCollectibleTokenIdsMap])

  useEffect(() => {
    const fetchCollectionList = async () => {
      if (selectedNetwork) {
        if (contractType === CollectibleContractTypeValues.ERC721) {
          const data = await collectibleStore.getERC721List(selectedNetwork.chainId)
          setCollectionList(data.tokens)
          setCollectionListDate(new Date(data.date))
        } else if (contractType === CollectibleContractTypeValues.ERC1155) {
          const data = await collectibleStore.getERC1155List(selectedNetwork.chainId)
          setCollectionList(data.tokens)
          setCollectionListDate(new Date(data.date))
        }
      }
    }

    fetchCollectionList()
  }, [selectedNetwork])

  useEffect(() => {
    if (!collectionListFilter) {
      return setFilteredCollectionList(collectionList?.slice(0, 8))
    }
    setFilteredCollectionList(
      collectionList
        ?.filter(
          collection =>
            collection.name && collection.name.toLowerCase().includes(collectionListFilter.toLowerCase())
        )
        .slice(0, 8)
    )
  }, [collectionList, collectionListFilter])

  const handleAdd = async () => {
    try {
      if (
        selectedNetwork &&
        contractType &&
        collectibleManualAddress &&
        collectibleManualTokenId &&
        manualCollectibleInfo
      ) {
        await collectibleStore.addCollectible({
          collectibleInfoParams: {
            chainId: selectedNetwork.chainId,
            address: collectibleManualAddress,
            tokenId: collectibleManualTokenId,
            contractType
          },
          collectibleInfoResponse: manualCollectibleInfo
        })
      }

      if (selectedCollectibles.length > 0) {
        selectedCollectibles.map(async collectible => {
          await collectibleStore.addCollectible({
            collectibleInfoParams: {
              chainId: collectible.chainId,
              address: collectible.address,
              tokenId: collectible.tokenId,
              contractType: collectible.contractType
            },
            collectibleInfoResponse: collectible.collectibleInfo
          })
        })
      }

      setIsAddingCollection(false)
      toast({
        variant: 'success',
        title: `Collectible${selectedCollectibles.length + (collectibleManualAddress ? 1 : 0) > 1 ? 's' : ''} added successfully`,
        description:
          "You'll be able to see this collectible on your browser as long as you don't clear your cache."
      })
      onClose()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'error',
        title: 'One or more collectibles failed to add',
        description: 'Please try again.'
      })
    }
  }

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const collectionList = JSON.parse(text)

      if (Array.isArray(collectionList)) {
        collectionList.map(collection => {
          if (!collection.address || !collection.name) {
            throw new Error('Invalid collection list')
          }
        })

        if (selectedNetwork && contractType) {
          if (contractType === CollectibleContractTypeValues.ERC721) {
            await collectibleStore.addExternalERC721List(selectedNetwork.chainId, collectionList)
          } else if (contractType === CollectibleContractTypeValues.ERC1155) {
            await collectibleStore.addExternalERC1155List(selectedNetwork.chainId, collectionList)
          }
        }

        toast({
          variant: 'success',
          title: `Custom collection list imported successfully`
        })
        onClose()
      } else {
        throw new Error('Invalid file format')
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: 'error',
        title: 'Failed to import token list',
        description: 'Please ensure the file format is correct.'
      })
    }
  }

  const handleImportCustomCollectibleList = () => {
    fileInputRef.current?.click()
  }

  const toggleSelectCollectible = async (collectible: any) => {
    const isSelected = selectedCollectibles.some(
      c => c.address === collectible.address && c.tokenId === collectible.tokenId
    )
    if (isSelected) {
      setSelectedCollectibles(
        selectedCollectibles.filter(
          c => c.address !== collectible.address && c.tokenId !== collectible.tokenId
        )
      )
    } else {
      setSelectedCollectibles([...selectedCollectibles, collectible])
    }
  }

  const showCollectible = (collectible: any, i: number) => {
    const isSelected = selectedCollectibles.some(
      c => c.address === collectible.address && c.tokenId === collectible.tokenId
    )

    return (
      <div
        key={i}
        className="flex flex-row items-center gap-3 sm:gap-4 bg-background-primary hover:bg-backgroundSecondary rounded-sm p-3"
        onClick={() => {
          toggleSelectCollectible(collectible)
        }}
      >
        <img src={collectible.collectibleInfo.image} className="w-10 h-10" />
        <Text variant="normal" fontWeight="semibold" color="text80">
          {collectible.collectibleInfo.name}
        </Text>

        <div className="flex flex-row items-center gap-2 ml-auto">
          <Text variant="normal" fontWeight="bold" color="text80">
            Balance:
          </Text>
          <Text variant="normal" fontWeight="bold" color="text80" className="mr-1">
            {collectible.contractType === CollectibleContractTypeValues.ERC721
              ? 1
              : ethers.formatUnits(
                  collectible.collectibleInfo.balance as BigNumberish,
                  collectible.collectibleInfo.decimals ?? 0
                )}
          </Text>
          <Checkbox checked={isSelected} />
        </div>
      </div>
    )
  }

  const handleRefreshCollectibleList = async () => {
    if (contractType === CollectibleContractTypeValues.ERC721) {
      const collectionData = await collectibleStore.resetERC721List(selectedNetwork.chainId)
      setCollectionList(collectionData.tokens)
      setCollectionListDate(new Date(collectionData.date))
    } else {
      const collectionData = await collectibleStore.resetERC1155List(selectedNetwork.chainId)
      setCollectionList(collectionData.tokens)
      setCollectionListDate(new Date(collectionData.date))
    }

    setConfirmRefreshList(false)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
      {selectedCollection ? (
        <div className="flex flex-col h-full p-4 sm:p-6 gap-6">
          <div className="flex flex-row items-center gap-3 sm:gap-4">
            <IconButton icon={ChevronLeftIcon} onClick={() => setSelectedCollection(undefined)} />

            <SelectedCollectionHeader collection={selectedCollection} />
          </div>

          <div className="flex flex-col gap-2">
            <TextInput
              leftIcon={SearchIcon}
              value={queryCollectibleTokenIdsMap[selectedCollection.address]}
              placeholder="Enter token IDs separated by commas"
              onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                setQueryCollectibleTokenIdsMap({
                  ...queryCollectibleTokenIdsMap,
                  [selectedCollection.address]: ev.target.value
                })
              }
            />
          </div>

          {isFetchingQueriedCollectibles ? (
            <div className="flex flex-row items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="flex flex-col">
              {selectedCollectibles?.map((collectible, i) => {
                if (collectible.address === selectedCollection.address) {
                  return showCollectible(collectible, i)
                }
              })}
              {queriedCollectibles?.map((collectible, i) => {
                if (
                  collectible.address === selectedCollection.address &&
                  !selectedCollectibles.some(c => c.tokenId === collectible.tokenId)
                ) {
                  return showCollectible(collectible, i)
                }
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full p-4 sm:p-6 gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Text variant="large" fontWeight="bold" color="text80">
              Import Collectibles
            </Text>

            <Select.Helper
              name="collectibleNetwork"
              options={mainnetNetworks.map(network => ({
                label: (
                  <div className="flex flex-row items-center gap-2">
                    <img src={network.logoURI} className="w-4 h-4" />
                    <Text variant="normal" className="text-primary/80">
                      {network.title}
                    </Text>
                  </div>
                ),
                value: network.chainId.toString()
              }))}
              value={selectedNetwork?.chainId.toString()}
              onValueChange={value =>
                setSelectedNetwork(networks.find(n => n.chainId === Number(value)) || mainnetNetworks[0])
              }
              className="h-7! rounded-lg! w-full sm:w-auto"
            />
          </div>

          <Tabs
            value={contractType}
            onValueChange={value => setContractType(value as CollectibleContractType)}
          >
            <TabsList className="h-8 w-fit justify-start">
              <TabsTrigger value={CollectibleContractTypeValues.ERC721} className="h-8 px-4">
                ERC721
              </TabsTrigger>
              <TabsTrigger value={CollectibleContractTypeValues.ERC1155} className="h-8 px-4">
                ERC1155
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-3">
            <TextInput
              leftIcon={SearchIcon}
              value={collectionListFilter}
              placeholder="Search for a collection"
              onChange={(ev: ChangeEvent<HTMLInputElement>) => setCollectionListFilter(ev.target.value)}
            />

            <Button
              variant="secondary"
              shape="square"
              className="mt-auto text-left whitespace-normal"
              onClick={selectedNetwork && contractType ? handleImportCustomCollectibleList : undefined}
            >
              <FolderIcon className="w-4 h-4" />

              {selectedNetwork && contractType
                ? `Import custom token list for ${contractType === CollectibleContractTypeValues.ERC721 ? 'ERC721' + ' on ' + selectedNetwork?.title : 'ERC1155' + ' on ' + selectedNetwork?.title}`
                : 'Select Network and Type to import custom token list'}
            </Button>
          </div>

          <div className="flex flex-col">
            {filteredCollectionList?.map((collection, i) => (
              <CollectionListItem
                collection={collection}
                key={i}
                onClick={() => setSelectedCollection(collection)}
              />
            ))}
          </div>

          <FileInput
            name="collectibleListFile"
            validExtensions={['json']}
            className="hidden"
            ref={fileInputRef}
            onValueChange={handleFileChange}
          />

          {collectionListDate && (
            <Button
              shape="square"
              size="xs"
              onClick={() => setConfirmRefreshList(true)}
              className="w-full sm:w-auto"
            >
              <RefreshIcon className="w-4 h-4" />
              Refresh list - last updated: {collectionListDate?.toLocaleString()}
            </Button>
          )}
        </div>
      )}
        <div className="px-4 sm:px-6">
          {isAddingCollectibleManually && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <Text variant="small" fontWeight="medium" color="text80">
                  Collectible Address
                </Text>

                <TextInput
                  name="collectibleAddress"
                  className="h-10 rounded-md"
                  value={collectibleManualAddress ?? ''}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                    setCollectibleManualAddress(ev.target.value)
                  }}
                />
              </div>
              <div className="flex flex-col mb-6 gap-0.5">
                <Text variant="small" fontWeight="medium" color="text80">
                  Token ID
                </Text>

                <TextInput
                  name="collectibleTokenId"
                  className="h-10 rounded-md"
                  value={collectibleManualTokenId ?? ''}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                    if (ev.target.value === '') {
                      setCollectibleManualTokenId(undefined)
                      return
                    }

                    setCollectibleManualTokenId(ev.target.value as unknown as number)
                  }}
                />
              </div>
            </div>
          )}

          {isFetchingCollectibleInfo && collectibleManualAddress && collectibleManualTokenId && (
            <div className="flex flex-row items-center justify-center mb-6">
              <Spinner size="lg" />
            </div>
          )}

          {collectibleError && !isFetchingCollectibleInfo && (
            <Text variant="normal" fontWeight="medium" color="negative">
              {collectibleError}
            </Text>
          )}

          {manualCollectibleInfo && !manualCollectibleInfo.isOwner && !isFetchingCollectibleInfo && (
            <div className="flex flex-row items-center mb-6">
              <Text color="warning">You do not own this collectible</Text>
            </div>
          )}

          {manualCollectibleInfo && manualCollectibleInfo.isOwner && !isFetchingCollectibleInfo && (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center bg-background-secondary p-3 sm:p-4 sm:px-6">
              <CheckmarkIcon className="w-4 h-4 text-positive" />

              <img src={manualCollectibleInfo.image} className="w-12 h-12" />

              <div className="flex flex-col gap-2">
                <Text variant="normal" fontWeight="bold" color="text80">
                  {manualCollectibleInfo.name ?? ''}
                </Text>
                <div className="flex flex-row items-center gap-2">
                  <Text variant="small" className="text-primary/80">
                    You have this collectible
                  </Text>

                  <div className="flex flex-row items-center gap-2">
                    <CloseIcon className="w-3 h-3" />
                    <Text variant="small" fontWeight="bold" color="text80">
                      {manualCollectibleInfo.balance
                        ? Number(
                            ethers.formatUnits(
                              manualCollectibleInfo.balance as BigNumberish,
                              manualCollectibleInfo.decimals ?? 0
                            )
                          )
                        : 1}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 border-t border-border-normal bg-background-primary">
        <div className="flex flex-col sm:flex-row p-4 sm:p-6 gap-2">
          {isAddingCollectibleManually ? (
            <Button
              size="md"
              shape="square"
              disabled={!selectedNetwork}
              onClick={() => {
                setIsAddingCollectibleManually(false)
                setCollectibleManualAddress('')
                setManualCollectibleInfo(undefined)
                setCollectibleError('')
              }}
              className="w-full sm:w-auto"
            >
              Hide
            </Button>
          ) : (
            <Button
              size="md"
              shape="square"
              disabled={!selectedNetwork}
              onClick={() => {
                setIsAddingCollectibleManually(true)
                setCollectibleError('')
              }}
              className="w-full sm:w-auto"
            >
              Manual Import
            </Button>
          )}

          <Button size="md" shape="square" className="w-full sm:w-auto sm:ml-auto" onClick={onClose}>
            Cancel
          </Button>

          <Button
            size="md"
            variant="primary"
            shape="square"
            disabled={(!manualCollectibleInfo && !selectedCollectibles.length) || isAddingCollection}
            onClick={() => {
              handleAdd()
            }}
            className="w-full sm:w-auto"
          >
            Add
          </Button>
        </div>
      </div>

      {confirmRefreshList && (
        <Modal size="sm">
          <div className="flex flex-col p-4 sm:p-6 gap-6">
            <Text variant="normal" fontWeight="medium" color="text80">
              {`Refreshing list will remove the manually imported list for ${selectedNetwork?.title}. Are you sure you want to continue?`}
            </Text>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button size="md" shape="square" onClick={() => setConfirmRefreshList(false)}>
                Cancel
              </Button>
              <Button size="md" shape="square" onClick={handleRefreshCollectibleList}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function CollectionListItem({ collection, onClick }: { collection: any; onClick: () => void }) {
  const [imageError, setImageError] = useState(false)

  return (
    <Button
      variant="secondary"
      className="flex border-none flex-row items-center gap-3 sm:gap-4 bg-background-primary hover:bg-background-hover rounded-sm p-3 w-full text-left mb-2 last:mb-0"
      onClick={onClick}
    >
      {imageError || !collection.logoURI ? (
        <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
          <CollectionIcon className="w-4 h-4 text-secondary" />
        </div>
      ) : (
        <img
          src={collection.logoURI}
          className="w-10 h-10 rounded-full"
          onError={() => setImageError(true)}
        />
      )}

      <Text variant="normal" fontWeight="semibold" color="text80">
        {collection.name}
      </Text>
    </Button>
  )
}

function SelectedCollectionHeader({ collection }: { collection: any }) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="flex flex-row items-center gap-3 sm:gap-4">
      {imageError || !collection.logoURI ? (
        <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
          <CollectionIcon className="w-4 h-4 text-secondary" />
        </div>
      ) : (
        <img
          src={collection.logoURI}
          className="w-10 h-10 rounded-full"
          onError={() => setImageError(true)}
        />
      )}

      <Text variant="large" fontWeight="semibold" color="text80">
        {collection.name}
      </Text>
    </div>
  )
}
