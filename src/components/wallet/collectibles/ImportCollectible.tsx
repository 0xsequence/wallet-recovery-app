import {
  Box,
  Button,
  Card,
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

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | undefined>()
  const [collectibleManualAddress, setCollectibleManualAddress] = useState<string | undefined>()
  const [collectibleManualTokenId, setCollectibleManualTokenId] = useState<number | undefined>()
  const [contractType, setContractType] = useState<CollectibleContractType | undefined>()

  const [collectibleInfo, setCollectibleInfo] = useState<CollectibleInfoResponse | undefined>()

  const [isAddingCollectible, setIsAddingCollectible] = useState(false)
  const [isAddingCollectibleManually, setIsAddingCollectibleManually] = useState(false)

  const [collectionList, setCollectionList] = useState<any[]>([])
  const [collectionListFilter, setCollectionListFilter] = useState<string>('')
  const [filteredCollectionList, setFilteredCollectionList] = useState<any[]>([])

  const [selectedCollection, setSelectedCollection] = useState<any[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log(filteredCollectionList)
  }, [filteredCollectionList])

  useEffect(() => {
    const fetchCollectibleList = async () => {
      if (selectedNetwork && contractType) {
        if (contractType === CollectibleContractTypeValues.ERC721) {
          setCollectionList(await collectibleStore.getDefaultERC721List(selectedNetwork.chainId))
        } else if (contractType === CollectibleContractTypeValues.ERC1155) {
          setCollectionList(await collectibleStore.getDefaultERC1155List(selectedNetwork.chainId))
        }
      }
    }

    fetchCollectibleList()

    if (selectedNetwork && collectibleManualAddress && collectibleManualTokenId && contractType) {
      collectibleStore
        .getCollectibleInfo({
          chainId: selectedNetwork.chainId,
          address: collectibleManualAddress,
          tokenId: collectibleManualTokenId,
          contractType
        })
        .then(response => {
          setCollectibleInfo(response)
        })
    } else {
      setCollectibleInfo(undefined)
    }
  }, [selectedNetwork, collectibleManualAddress, collectibleManualTokenId, contractType])

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
    const fetchCollectionList = async () => {
      if (selectedNetwork) {
        if (contractType === CollectibleContractTypeValues.ERC721) {
          setCollectionList(await collectibleStore.getDefaultERC721List(selectedNetwork.chainId))
        } else if (contractType === CollectibleContractTypeValues.ERC1155) {
          setCollectionList(await collectibleStore.getDefaultERC1155List(selectedNetwork.chainId))
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

  const toggleSelectCollectible = async (collectionAddress: string) => {
    const isSelected = selectedCollection.some(collection => collection.address === collectionAddress)
    if (isSelected) {
      setSelectedCollection(
        selectedCollection.filter(collectible => collectible.address !== collectionAddress)
      )
    } else {
      setSelectedCollection([...selectedCollection, { address: collectionAddress, info: undefined }])
    }
  }

  const handleAdd = async () => {
    if (
      selectedNetwork &&
      collectibleManualAddress &&
      collectibleInfo &&
      collectibleManualTokenId &&
      contractType
    ) {
      await collectibleStore.addCollectible({
        collectibleInfoParams: {
          chainId: selectedNetwork.chainId,
          address: collectibleManualAddress,
          tokenId: collectibleManualTokenId,
          contractType
        },
        collectibleInfoResponse: collectibleInfo
      })
      setIsAddingCollectible(false)
      toast({
        variant: 'success',
        title:
          contractType === CollectibleContractTypeValues.ERC721
            ? 'ERC721 collectible added successfully'
            : 'ERC1155 collectible added successfully',
        description:
          "You'll be able to see this collectible on your browser as long as you don't clear your cache."
      })
      resetInputs()
      onClose()
    }
  }

  const resetInputs = () => {
    setCollectibleManualAddress(undefined)
    setSelectedNetwork(undefined)
    setCollectibleManualTokenId(undefined)
    setContractType(undefined)
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

  return (
    // <Box flexDirection="column">
    //   <Box flexDirection="column" padding="6" gap="6">
    //     <Text variant="large" fontWeight="bold" color="text80">
    //       Import ERC721 or ERC1155 Collectibles
    //     </Text>

    //     <Box flexDirection="column" gap="3">
    //       <Box flexDirection="column" gap="1">
    //         <Text variant="normal" fontWeight="medium" color="text80">
    //           Collectible Network
    //         </Text>

    //         <Select
    //           name="collectibleNetwork"
    //           options={selectOptions}
    //           onValueChange={value => setSelectedNetwork(networks.find(n => n.chainId === Number(value)))}
    //         />
    //       </Box>

    //       <Box flexDirection="column" gap="1">
    //         <Text variant="normal" fontWeight="medium" color="text80">
    //           Collectible Type
    //         </Text>

    //         <Select
    //           name="collectibleType"
    //           options={[
    //             { value: 'ERC721', label: 'ERC721' },
    //             { value: 'ERC1155', label: 'ERC1155' }
    //           ]}
    //           onValueChange={value => setContractType(value as CollectibleContractType)}
    //         />
    //       </Box>

    //       <Box flexDirection="column" gap="0.5">
    //         <Text variant="normal" fontWeight="medium" color="text80">
    //           Token
    //         </Text>

    //         <Box
    //           onClick={() => {}}
    //           width="fit"
    //           cursor="pointer"
    //           paddingBottom="0.5"
    //           opacity={{ base: '100', hover: '80' }}
    //         >
    //           <Text variant="normal" fontWeight="medium" color="text50">
    //             Import external token list
    //           </Text>
    //         </Box>

    //         <Select
    //           name="collectibleList"
    //           options={
    //             collectibleList?.slice(0, 20).map(collectible => {
    //               return {
    //                 label: collectible.name,
    //                 value: collectible.address
    //               }
    //             }) ?? []
    //           }
    //           onValueChange={value => setCollectibleAddress(value)}
    //         />
    //       </Box>

    //       {isAddingCollectibleManually && (
    //         <>
    //           <Box flexDirection="column" gap="0.5">
    //             <Text variant="normal" fontWeight="medium" color="text80">
    //               Collectible Address
    //             </Text>

    //             <Box flexDirection="row" gap="1" paddingBottom="0.5">
    //               <Text variant="normal" fontWeight="medium" color="text50">
    //                 See addresses on network's
    //               </Text>

    //               <Text
    //                 variant="normal"
    //                 color="text50"
    //                 underline={!!tokenDirectory}
    //                 cursor={tokenDirectory ? 'pointer' : 'default'}
    //                 onClick={() => {
    //                   if (tokenDirectory) {
    //                     window.open(tokenDirectory)
    //                   }
    //                 }}
    //               >
    //                 directory
    //               </Text>
    //             </Box>

    //             <TextInput
    //               name="collectibleAddress"
    //               value={collectibleAddress ?? ''}
    //               onChange={(ev: ChangeEvent<HTMLInputElement>) => {
    //                 setCollectibleAddress(ev.target.value)
    //               }}
    //             />
    //           </Box>

    //           <Box flexDirection="column" gap="0.5">
    //             <Text variant="normal" fontWeight="medium" color="text80">
    //               Collectible Token ID
    //             </Text>

    //             <TextInput
    //               name="collectibleTokenId"
    //               value={collectibleTokenId ?? ''}
    //               onKeyPress={(event: { key: string; preventDefault: () => void }) => {
    //                 if (!/[0-9]/.test(event.key)) {
    //                   event.preventDefault()
    //                 }
    //               }}
    //               onChange={(ev: ChangeEvent<HTMLInputElement>) => {
    //                 if (ev.target.value === '') {
    //                   setCollectibleTokenId(undefined)
    //                   return
    //                 }

    //                 setCollectibleTokenId(ev.target.value as unknown as number)
    //               }}
    //             />
    //           </Box>
    //         </>
    //       )}
    //     </Box>

    //     {isFetchingCollectibleInfo && (
    //       <Box alignItems="center" justifyContent="center">
    //         <Spinner size="lg" />
    //       </Box>
    //     )}

    //     {collectibleInfoResponse && !collectibleInfoResponse.isOwner && !isFetchingCollectibleInfo && (
    //       <Box alignItems="center" justifyContent="center">
    //         <Text variant="medium" color="warning">
    //           You do not own this collectible
    //         </Text>
    //       </Box>
    //     )}

    //     {collectibleInfoResponse && collectibleInfoResponse.isOwner && !isFetchingCollectibleInfo && (
    //       <Card flexDirection="row" gap="6">
    //         <Image src={collectibleInfoResponse.image} style={{ width: '120px', height: 'auto' }} />

    //         <Box flexDirection="column" gap="2">
    //           <Text variant="medium" fontWeight="bold" color="text80">
    //             {collectibleInfoResponse.name ?? ''}
    //           </Text>
    //           <Text variant="small" color="text80">
    //             Your Balance:
    //           </Text>
    //           <Text variant="medium" fontWeight="bold" color="text80">
    //             {Number(
    //               ethers.formatUnits(
    //                 collectibleInfoResponse.balance as BigNumberish,
    //                 collectibleInfoResponse.decimals ?? 0
    //               )
    //             )}
    //           </Text>
    //         </Box>
    //       </Card>
    //     )}
    //   </Box>

    //   <Divider marginY="0" />

    //   <Box flexDirection="row" padding="6" gap="2">
    //     {!isAddingCollectibleManually && (
    //       <Button
    //         label="Manual Import"
    //         shape="square"
    //         onClick={() => {
    //           setIsAddingCollectibleManually(true)
    //         }}
    //       />
    //     )}

    //     <Button label="Cancel" size="md" shape="square" marginLeft="auto" onClick={onClose} />

    //     <Button
    //       label="Add Collectible"
    //       variant="primary"
    //       shape="square"
    //       disabled={collectibleInfoResponse === undefined || isAddingCollectible}
    //       onClick={() => {
    //         handleAdd()
    //       }}
    //     />
    //   </Box>
    // </Box>
    <Box flexDirection="column" height="full">
      <Box flexDirection="column" height="full" padding="6" gap="6">
        <Box flexDirection="row" alignItems="center" gap="4">
          <Text variant="large" fontWeight="bold" color="text80">
            Import NFT
          </Text>

          <Select
            name="collectibleNetwork"
            placeholder="Select Network"
            options={selectOptions}
            onValueChange={value => setSelectedNetwork(networks.find(n => n.chainId === Number(value)))}
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
                <Divider color="white" height="0.5" position="relative" marginY="0" style={{ top: '6px' }} />
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
                <Divider color="white" height="0.5" position="relative" marginY="0" style={{ top: '6px' }} />
              )}
            </Box>
          </Box>
          <Divider marginY="0" />
        </Box>

        <Box flexDirection="column" gap="2">
          <TextInput
            leftIcon={SearchIcon}
            value={collectionListFilter}
            placeholder="Search for a collectible"
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
          {filteredCollectionList?.map((collectible, i) => {
            return (
              <Box
                key={i}
                flexDirection="row"
                alignItems="center"
                background={{ base: 'backgroundPrimary', hover: 'backgroundSecondary' }}
                onClick={() => {
                  toggleSelectCollectible(collectible.address)
                }}
                borderRadius="sm"
                padding="3"
                gap="4"
              >
                <Image src={collectible.logoURI} maxHeight="10" maxWidth="10" />
                <Text variant="normal" fontWeight="semibold" color="text80">
                  {collectible.name}
                </Text>
                <Box flexDirection="row" alignItems="center" marginLeft="auto" gap="2">
                  {selectedCollection?.filter(c => c.address.includes(collectible.address)).length > 0 && (
                    <>
                      <Text variant="normal" fontWeight="bold" color="text80">
                        Balance:
                      </Text>
                      {selectedCollection?.filter(c => c.address.includes(collectible.address))[0].info
                        ?.balance ? (
                        <Text variant="normal" fontWeight="bold" color="text80">
                          {
                            selectedCollection?.filter(c => c.address.includes(collectible.address))[0].info
                              ?.balance
                          }
                        </Text>
                      ) : (
                        <Spinner size="md" marginRight="1" />
                      )}
                    </>
                  )}
                  <FilledRoundCheckBox
                    checked={
                      (selectedCollection?.filter(c => c.address.includes(collectible.address)).length || 0) >
                      0
                    }
                  />
                </Box>
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
      </Box>

      <Box marginTop="auto">
        <Box paddingX="6">
          {isAddingCollectibleManually && (
            <Box flexDirection="column" marginBottom="6" gap="0.5">
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
          )}

          {isFetchingCollectibleInfo && collectibleManualAddress ? (
            <Box alignItems="center" marginBottom="6" justifyContent="center">
              <Spinner size="lg" />
            </Box>
          ) : (
            collectibleInfo && (
              <Card flexDirection="column" marginBottom="6" gap="2">
                <Text variant="medium" fontWeight="bold" color="text80">
                  {collectibleInfo.name ?? ''}
                </Text>
                <Text variant="small" color="text80">
                  Your Balance:
                </Text>
                <Text variant="medium" fontWeight="bold" color="text80">
                  {collectibleInfo.balance}
                </Text>
              </Card>
            )
          )}
        </Box>

        <Divider marginY="0" />

        <Box>
          <Box flexDirection="row" padding="6" gap="2">
            {isAddingCollectibleManually ? (
              <Button
                label="Hide"
                shape="square"
                disabled={!selectedNetwork}
                onClick={() => {
                  setIsAddingCollectibleManually(false)
                  setCollectibleManualAddress('')
                  setCollectibleInfo(undefined)
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
              disabled={(collectibleInfo === undefined && !selectedCollection.length) || isAddingCollectible}
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
