import {
  Box,
  Button,
  Card,
  ChevronLeftIcon,
  Divider,
  Image,
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

  const selectOptions = mainnetNetworks
    .filter(network => !network.disabled)
    .map(network => ({
      label: (
        <Box flexDirection="row" alignItems="center" gap="2">
          <Image src={network.logoURI} maxWidth="8" maxHeight="8" />
          <Text>{network.title}</Text>
        </Box>
      ),
      value: network.chainId.toString()
    }))

  useEffect(() => {
    const fetchCollectibleList = async () => {
      if (selectedNetwork && contractType) {
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
            console.log('response', response)
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
      if (!queryCollectibleTokenIdsMap[selectedCollection.address]) return

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
    if (!collectionListFilter) return setFilteredCollectionList(collectionList?.slice(0, 8))
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
      <Box
        key={i}
        flexDirection="row"
        alignItems="center"
        background={{ base: 'backgroundPrimary', hover: 'backgroundSecondary' }}
        onClick={() => {
          toggleSelectCollectible(collectible)
        }}
        borderRadius="sm"
        padding="3"
        gap="4"
      >
        <Image src={collectible.collectibleInfo.image} maxHeight="10" maxWidth="10" />
        <Text variant="normal" fontWeight="semibold" color="text80">
          {collectible.collectibleInfo.name}
        </Text>
        <Box flexDirection="row" alignItems="center" marginLeft="auto" gap="2">
          <Text variant="normal" fontWeight="bold" color="text80">
            Balance:
          </Text>
          <Text variant="normal" fontWeight="bold" color="text80" marginRight="1">
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
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" height="fit" minHeight="full">
      {selectedCollection ? (
        <Box flexDirection="column" height="full" padding="6" gap="6">
          <Box flexDirection="row" alignItems="center" gap="4">
            <Button leftIcon={ChevronLeftIcon} onClick={() => setSelectedCollection(undefined)} />
            <Image src={selectedCollection.logoURI} maxHeight="10" maxWidth="10" />
            <Text variant="large" fontWeight="bold" color="text80">
              {selectedCollection.name}
            </Text>
          </Box>

          <Box flexDirection="column" gap="2">
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
          </Box>

          {isFetchingQueriedCollectibles ? (
            <Box alignItems="center" justifyContent="center">
              <Spinner size="lg" />
            </Box>
          ) : (
            <Box flexDirection="column">
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
            </Box>
          )}
        </Box>
      ) : (
        <Box flexDirection="column" height="full" padding="6" gap="6">
          <Box flexDirection="row" alignItems="center" gap="4">
            <Text variant="large" fontWeight="bold" color="text80">
              Import NFT
            </Text>

            <Select
              name="collectibleNetwork"
              placeholder="Select Network"
              value={selectedNetwork?.chainId.toString()}
              options={selectOptions}
              onValueChange={value =>
                setSelectedNetwork(networks.find(n => n.chainId === Number(value)) || mainnetNetworks[0])
              }
            />
          </Box>

          <Box flexDirection="column" style={{ gap: '5px' }}>
            <Box gap="2">
              <Box onClick={() => setContractType(CollectibleContractTypeValues.ERC721)}>
                <Text
                  variant="normal"
                  fontWeight="semibold"
                  color={contractType === CollectibleContractTypeValues.ERC721 ? 'text100' : 'text50'}
                  paddingX="4"
                >
                  ERC721
                </Text>
                {contractType === CollectibleContractTypeValues.ERC721 && (
                  <Divider
                    color="white"
                    height="0.5"
                    position="relative"
                    marginY="0"
                    style={{ top: '6px' }}
                  />
                )}
              </Box>

              <Box onClick={() => setContractType(CollectibleContractTypeValues.ERC1155)}>
                <Text
                  variant="normal"
                  fontWeight="semibold"
                  color={contractType === CollectibleContractTypeValues.ERC1155 ? 'text100' : 'text50'}
                  paddingX="4"
                >
                  ERC1155
                </Text>
                {contractType === CollectibleContractTypeValues.ERC1155 && (
                  <Divider
                    color="white"
                    height="0.5"
                    position="relative"
                    marginY="0"
                    style={{ top: '6px' }}
                  />
                )}
              </Box>
            </Box>
            <Divider marginY="0" />
          </Box>

          <Box flexDirection="column" gap="2">
            <TextInput
              leftIcon={SearchIcon}
              value={collectionListFilter}
              placeholder="Search for a collection"
              onChange={(ev: ChangeEvent<HTMLInputElement>) => setCollectionListFilter(ev.target.value)}
            />

            <Button
              label={
                selectedNetwork && contractType
                  ? `Import custom token list for ${contractType === CollectibleContractTypeValues.ERC721 ? 'ERC721' + ' on ' + selectedNetwork?.title : 'ERC1155' + ' on ' + selectedNetwork?.title}`
                  : 'Select Network and Type to import custom token list'
              }
              variant="text"
              shape="square"
              marginTop="auto"
              onClick={selectedNetwork && contractType ? handleImportCustomCollectibleList : undefined}
            />
          </Box>

          <Box flexDirection="column">
            {filteredCollectionList?.map((collection, i) => {
              return (
                <Box
                  key={i}
                  flexDirection="row"
                  alignItems="center"
                  background={{ base: 'backgroundPrimary', hover: 'backgroundSecondary' }}
                  onClick={() => {
                    setSelectedCollection(collection)
                  }}
                  borderRadius="sm"
                  padding="3"
                  gap="4"
                >
                  <Image src={collection.logoURI} maxHeight="10" maxWidth="10" />
                  <Text variant="normal" fontWeight="semibold" color="text80">
                    {collection.name}
                  </Text>
                </Box>
              )
            })}
          </Box>

          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {selectedNetwork && (
            <Button
              label={`RESET LIST - last updated: ${collectionListDate?.toLocaleString()}`}
              variant="text"
              color="text50"
              onClick={async () => {
                if (contractType === CollectibleContractTypeValues.ERC721) {
                  const collectionData = await collectibleStore.resetERC721List(selectedNetwork.chainId)
                  setCollectionList(collectionData.tokens)
                  setCollectionListDate(new Date(collectionData.date))
                } else {
                  const collectionData = await collectibleStore.resetERC1155List(selectedNetwork.chainId)
                  setCollectionList(collectionData.tokens)
                  setCollectionListDate(new Date(collectionData.date))
                }
              }}
            />
          )}
        </Box>
      )}

      <Box marginTop="auto">
        <Box paddingX="6">
          {isAddingCollectibleManually && (
            <Box flexDirection="column" gap="3">
              <Box flexDirection="column" gap="0.5">
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
              </Box>
              <Box flexDirection="column" marginBottom="6" gap="0.5">
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
              </Box>
            </Box>
          )}

          {isFetchingCollectibleInfo && collectibleManualAddress && collectibleManualTokenId && (
            <Box alignItems="center" justifyContent="center" marginBottom="6">
              <Spinner size="lg" />
            </Box>
          )}

          {manualCollectibleInfo && !manualCollectibleInfo.isOwner && !isFetchingCollectibleInfo && (
            <Box alignItems="center" justifyContent="center" marginBottom="6">
              <Text variant="medium" color="warning">
                You do not own this collectible
              </Text>
            </Box>
          )}

          {manualCollectibleInfo && manualCollectibleInfo.isOwner && !isFetchingCollectibleInfo && (
            <Card flexDirection="row" gap="6">
              <Image src={manualCollectibleInfo.image} style={{ width: '120px', height: 'auto' }} />

              <Box flexDirection="column" gap="2">
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
              </Box>
            </Card>
          )}
        </Box>

        <Divider marginY="0" />

        <Box width="full">
          <Box flexDirection="row" padding="6" gap="2">
            {isAddingCollectibleManually ? (
              <Button
                label="Hide"
                shape="square"
                disabled={!selectedNetwork}
                onClick={() => {
                  setIsAddingCollectibleManually(false)
                  setCollectibleManualAddress('')
                  setManualCollectibleInfo(undefined)
                }}
              />
            ) : (
              <Button
                label="Manual Import"
                shape="square"
                disabled={!selectedNetwork}
                onClick={() => {
                  setIsAddingCollectibleManually(true)
                }}
              />
            )}

            <Button label="Cancel" size="md" shape="square" marginLeft="auto" onClick={onClose} />

            <Button
              label="Add"
              variant="primary"
              shape="square"
              disabled={(!manualCollectibleInfo && !selectedCollectibles.length) || isAddingCollection}
              onClick={() => {
                handleAdd()
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
