import {
  Button,
  ChevronLeftIcon,
  IconButton,
  Modal,
  SearchIcon,
  Select,
  Spinner,
  Text,
  TextInput,
  useToast
} from '@0xsequence/design-system'
import { NetworkConfig, NetworkType } from '@0xsequence/network'
import { BigNumberish, ethers } from 'ethers'
import { ChangeEvent, useEffect, useRef, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import {
  CollectibleContractType,
  CollectibleContractTypeValues,
  CollectibleInfoResponse,
  CollectibleStore
} from '~/stores/CollectibleStore'
import { NetworkStore } from '~/stores/NetworkStore'

import { FilledRoundCheckBox } from '~/components/misc'

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

  const [queryCollectibleTokenIdsMap, setQueryCollectibleTokenIdsMap] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

/*  const selectOptions = mainnetNetworks
    .filter(network => !network.disabled)
    .map(network => ({
      label: (
        <div className='flex flex-row items-center gap-2'>
          <img src={network.logoURI} className='w-8 h-8' />
          <Text>{network.title}</Text>
        </div>
      ),
      value: network.chainId.toString()
    }))
      */

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
        collectibleStore
          .getCollectibleInfo({
            chainId: selectedNetwork.chainId,
            address: collectibleManualAddress,
            tokenId: collectibleManualTokenId,
            contractType
          })
          .then(response => {
            setManualCollectibleInfo(response)
          })
      }
    }

    fetchCollectibleList()
    fetchCollectibleInfo()
  }, [selectedNetwork, contractType, collectibleManualAddress, collectibleManualTokenId])

  useEffect(() => {
    const fetchQueriedCollectibles = async () => {
      setQueriedCollectibles([])
      if (!queryCollectibleTokenIdsMap[selectedCollection.address]) {return}

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
    if (!collectionListFilter) {return setFilteredCollectionList(collectionList?.slice(0, 8))}
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
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
    return (
      <div
        key={i}
        className='flex flex-row items-center gap-4 bg-background-primary hover:bg-backgroundSecondary rounded-sm p-3'
        onClick={() => {
          toggleSelectCollectible(collectible)
        }}
      >
        <img src={collectible.collectibleInfo.image} className='w-10 h-10' />
        <Text variant="normal" fontWeight="semibold" color="text80">
          {collectible.collectibleInfo.name}
        </Text>
        <div className='flex flex-row items-center gap-2 ml-auto'>
          <Text variant="normal" fontWeight="bold" color="text80">
            Balance:
          </Text>
          <Text variant="normal" fontWeight="bold" color="text80" className='mr-1'>
            {collectible.contractType === CollectibleContractTypeValues.ERC721
              ? 1
              : ethers.formatUnits(
                collectible.collectibleInfo.balance as BigNumberish,
                collectible.collectibleInfo.decimals ?? 0
              )}
          </Text>
          <FilledRoundCheckBox
            checked={
              (selectedCollectibles?.filter(c => c.address.includes(collectible.address)).length || 0) > 0
            }
          />
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
    <div className='flex flex-col h-fit min-h-full'>
      {selectedCollection ? (
        <div className='flex flex-col h-full p-6 gap-6'>
          <div className='flex flex-row items-center gap-4'>
            <IconButton icon={ChevronLeftIcon} onClick={() => setSelectedCollection(undefined)} />

            <img src={selectedCollection.logoURI} className='w-10 h-10' />

            <Text variant="large" fontWeight="bold" color="text80">
              {selectedCollection.name}
            </Text>
          </div>

          <div className='flex flex-col gap-2'>
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
            <div className='flex flex-row items-center justify-center'>
              <Spinner size="lg" />
            </div>
          ) : (
            <div className='flex flex-col'>
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
        <div className='flex flex-col h-full p-6 gap-6'>
          <div className='flex flex-row items-center gap-4'>
            <Text variant="large" fontWeight="bold" color="text80">
              Import NFT
            </Text>

            <Select
              name="collectibleNetwork"

              value={selectedNetwork?.chainId.toString()}
              onValueChange={value =>
                setSelectedNetwork(networks.find(n => n.chainId === Number(value)) || mainnetNetworks[0])
              }
            />
          </div>

          <div className='flex flex-col gap-2' style={{ gap: '5px' }}>
            <div className='flex flex-row gap-2'>
              <div onClick={() => setContractType(CollectibleContractTypeValues.ERC721)}>
                <Text
                  variant="normal"
                  fontWeight="semibold"
                  color={contractType === CollectibleContractTypeValues.ERC721 ? 'text100' : 'text50'}
                  className='px-4 cursor-pointer'
                >
                  ERC721
                </Text>
                {contractType === CollectibleContractTypeValues.ERC721 && (
                  <div
                    className='h-0.5 relative top-6 bg-white'
                  />
                )}
              </div>

              <div onClick={() => setContractType(CollectibleContractTypeValues.ERC1155)}>
                <Text
                  variant="normal"
                  fontWeight="semibold"
                  color={contractType === CollectibleContractTypeValues.ERC1155 ? 'text100' : 'text50'}
                  className='px-4 cursor-pointer'
                >
                  ERC1155
                </Text>
                {contractType === CollectibleContractTypeValues.ERC1155 && (
                  <div
                    className='h-0.5 relative top-6 bg-white'
                  />
                )}
              </div>
            </div>
            <div className='h-0 bg-white' />
          </div>

          <div className='flex flex-col gap-3'>
            <TextInput
              leftIcon={SearchIcon}
              value={collectionListFilter}
              placeholder="Search for a collection"
              onChange={(ev: ChangeEvent<HTMLInputElement>) => setCollectionListFilter(ev.target.value)}
            />

            <Button
              variant="text"
              shape="square"
              className='mt-auto'
              onClick={selectedNetwork && contractType ? handleImportCustomCollectibleList : undefined}
            >
              {selectedNetwork && contractType
                ? `Import custom token list for ${contractType === CollectibleContractTypeValues.ERC721 ? 'ERC721' + ' on ' + selectedNetwork?.title : 'ERC1155' + ' on ' + selectedNetwork?.title}`
                : 'Select Network and Type to import custom token list'}
            </Button>
          </div>

          <div className='flex flex-col'>
            {filteredCollectionList?.map((collection, i) => {
              return (
                <div
                  key={i}
                  className='flex flex-row items-center gap-4 bg-background-primary hover:bg-backgroundSecondary rounded-sm p-3'
                  onClick={() => {
                    setSelectedCollection(collection)
                  }}
                >
                  <img src={collection.logoURI} className='w-10 h-10 rounded-full' />
                  <Text variant="normal" fontWeight="semibold" color="text80">
                    {collection.name}
                  </Text>
                </div>
              )
            })}
          </div>

          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {collectionListDate && (
            <Button
              shape="square"
              size="xs"
              onClick={() => setConfirmRefreshList(true)}
            >
              Refresh list - last updated: {collectionListDate?.toLocaleString()}
            </Button>
          )}
        </div>
      )}
      <div className='mt-auto'>
        <div className='px-6'>
          {isAddingCollectibleManually && (
            <div className='flex flex-col gap-3'>
              <div className='flex flex-col gap-0.5'>
                <Text variant="normal" fontWeight="medium" color="text80">
                  Collectible Address
                </Text>

                <TextInput
                  name="collectibleAddress"
                  value={collectibleManualAddress ?? ''}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                    setCollectibleManualAddress(ev.target.value)
                  }}
                />
              </div>
              <div className='flex flex-col mb-6 gap-0.5'>
                <Text variant="normal" fontWeight="medium" color="text80">
                  Token ID
                </Text>

                <TextInput
                  name="collectibleTokenId"
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
            </div >
          )}

          {isFetchingCollectibleInfo && collectibleManualAddress && collectibleManualTokenId && (
            <div className='flex flex-row items-center justify-center mb-6'>
              <Spinner size="lg" />
            </div>
          )}

          {manualCollectibleInfo && !manualCollectibleInfo.isOwner && !isFetchingCollectibleInfo && (
            <div className='flex flex-row items-center justify-center mb-6'>
              <Text variant="medium" color="warning">
                You do not own this collectible
              </Text>
            </div>
          )}

          {manualCollectibleInfo && manualCollectibleInfo.isOwner && !isFetchingCollectibleInfo && (
            <div className='flex flex-row gap-6'>
              <img src={manualCollectibleInfo.image} className='w-32 h-32' />

              <div className='flex flex-col gap-2'>
                <Text variant="medium" fontWeight="bold" color="text80">
                  {manualCollectibleInfo.name ?? ''}
                </Text>
                <Text variant="small" color="text80">
                  Your Balance:
                </Text>
                <Text variant="medium" fontWeight="bold" color="text80">
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
          )}
        </div>

        <div className='h-0 bg-white' />

        <div className='w-full'>
          <div className='flex flex-row p-6 gap-2'>
            {isAddingCollectibleManually ? (
              <Button
                size="md"
                shape="square"
                disabled={!selectedNetwork}
                onClick={() => {
                  setIsAddingCollectibleManually(false)
                  setCollectibleManualAddress('')
                  setManualCollectibleInfo(undefined)
                }}
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
                }}
              >
                Manual Import
              </Button>
            )}

            <Button size="md" shape="square" className='ml-auto' onClick={onClose}>
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
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {confirmRefreshList && (
        <Modal size="sm">
          <div className='flex flex-col p-6 gap-6'>
            <Text variant="normal" fontWeight="medium" color="text80">
              {`Refreshing list will remove the manually imported list for ${selectedNetwork?.title}. Are you sure you want to continue?`}
            </Text>

            <div className='flex flex-row justify-end gap-3'>
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
