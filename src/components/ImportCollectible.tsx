import { Box, Button, Card, Select, Spinner, Text, TextInput, useToast } from '@0xsequence/design-system'
import { NetworkConfig, NetworkType } from '@0xsequence/network'
import { BigNumberish } from 'ethers'
import { ethers } from 'ethers'
import { ChangeEvent, useEffect, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { CollectibleContractType, CollectibleInfoResponse, CollectibleStore } from '~/stores/CollectibleStore'
import { NetworkStore } from '~/stores/NetworkStore'

export default function ImportCollectible({ onClose }: { onClose: () => void }) {
  const networkStore = useStore(NetworkStore)
  const networks = networkStore.networks.get()
  const mainnetNetworks = networks.filter(network => network.type === NetworkType.MAINNET)

  const collectibleStore = useStore(CollectibleStore)
  const isFetchingCollectibleInfo = useObservable(collectibleStore.isFetchingCollectibleInfo)

  const toast = useToast()

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | undefined>()
  const [collectibleAddress, setCollectibleAddress] = useState<string | undefined>()
  const [collectibleTokenId, setCollectibleTokenId] = useState<number | undefined>()
  const [contractType, setContractType] = useState<CollectibleContractType | undefined>()

  const [collectibleInfoResponse, setCollectibleInfoResponse] = useState<
    CollectibleInfoResponse | undefined
  >()

  const [isAddingCollectible, setIsAddingCollectible] = useState(false)

  useEffect(() => {
    if (selectedNetwork && collectibleAddress && collectibleTokenId && contractType) {
      collectibleStore
        .getCollectibleInfo({
          chainId: selectedNetwork.chainId,
          address: collectibleAddress,
          tokenId: collectibleTokenId,
          contractType
        })
        .then(response => {
          setCollectibleInfoResponse(response)
        })

      // tokenStore.getTokenInfo(selectedNetwork.chainId, tokenAddress).then(tokenInfo => {
      //   setTokenInfo(tokenInfo)
      // })
    } else {
      // setTokenInfo(undefined)
    }
  }, [selectedNetwork, collectibleAddress, collectibleTokenId, contractType])

  const selectOptions = mainnetNetworks.map(network => ({
    label: network.title,
    value: network.chainId.toString()
  }))

  const handleAdd = async () => {
    if (
      selectedNetwork &&
      collectibleAddress &&
      collectibleInfoResponse &&
      collectibleTokenId &&
      contractType
    ) {
      collectibleStore.addCollectible(
        {
          chainId: selectedNetwork.chainId,
          address: collectibleAddress,
          tokenId: collectibleTokenId,
          contractType
        },
        collectibleInfoResponse
      )
    }
  }

  const resetInputs = () => {
    setCollectibleAddress(undefined)
    setSelectedNetwork(undefined)
    setCollectibleTokenId(undefined)
    setContractType(undefined)
  }

  return (
    <Card
      flexDirection="column"
      paddingY="4"
      paddingX="8"
      marginBottom="8"
      borderRadius="md"
      width="full"
      height="full"
      alignItems="center"
      disabled={isAddingCollectible}
    >
      <Box>
        <Text variant="medium" color="text80">
          Import ERC721 or ERC1155 Collectible
        </Text>
      </Box>
      <Box flexDirection="column" width="full" marginTop="4" gap="4">
        <Select
          label="Collectible Network"
          labelLocation="left"
          name="collectibleNetwork"
          options={selectOptions}
          onValueChange={value => setSelectedNetwork(networks.find(n => n.chainId === Number(value)))}
        />

        <TextInput
          width="full"
          label="Collectible Address"
          labelLocation="left"
          name="collectibleAddress"
          value={collectibleAddress ?? ''}
          onChange={(ev: ChangeEvent<HTMLInputElement>) => {
            setCollectibleAddress(ev.target.value)
          }}
        />

        <Select
          label="Collectible Type"
          labelLocation="left"
          name="collectibleType"
          options={[
            { value: 'ERC721', label: 'ERC721' },
            { value: 'ERC1155', label: 'ERC1155' }
          ]}
          onValueChange={value => setContractType(value as CollectibleContractType)}
        />

        <TextInput
          width="full"
          label="Collectible Token ID"
          labelLocation="left"
          name="collectibleId"
          value={collectibleTokenId ?? ''}
          onKeyPress={(event: { key: string; preventDefault: () => void }) => {
            if (!/[0-9]/.test(event.key)) {
              event.preventDefault()
            }
          }}
          onChange={(ev: ChangeEvent<HTMLInputElement>) => {
            if (ev.target.value === '') {
              setCollectibleTokenId(undefined)
              return
            }

            setCollectibleTokenId(ev.target.value as unknown as number)
          }}
        />

        {isFetchingCollectibleInfo && (
          <Box marginTop="4" alignItems="center" justifyContent="center">
            <Spinner size="lg" />
          </Box>
        )}

        {collectibleInfoResponse && !collectibleInfoResponse.isOwner && !isFetchingCollectibleInfo && (
          <Box alignItems="center" justifyContent="center">
            <Text variant="medium" color="warning">
              You do not own this collectible
            </Text>
          </Box>
        )}

        {collectibleInfoResponse && collectibleInfoResponse.isOwner && !isFetchingCollectibleInfo && (
          <Box marginTop="4" alignItems="center" justifyContent="center">
            <Card flexDirection="column" gap="2">
              <Box flexDirection="row" gap="6">
                <img
                  src={collectibleInfoResponse.image ?? ''}
                  alt={collectibleInfoResponse.name ?? ''}
                  style={{ width: '120px', height: 'auto' }}
                />
                <Box flexDirection="column" gap="2">
                  <Text variant="medium" color="text100">
                    {collectibleInfoResponse.name ?? ''}
                  </Text>
                  {collectibleInfoResponse.balance && (
                    <>
                      <Text variant="small" color="text80">
                        Your Balance:
                      </Text>
                      <Text variant="medium" color="text100">
                        {Number(
                          ethers.formatUnits(
                            collectibleInfoResponse.balance as BigNumberish,
                            collectibleInfoResponse.decimals ?? 0
                          )
                        )}
                      </Text>
                    </>
                  )}
                </Box>
              </Box>
            </Card>
          </Box>
        )}

        <Box alignItems="center" justifyContent="flex-end" gap="8" marginTop="4">
          <Button
            label="Cancel"
            variant="text"
            size="md"
            shape="square"
            disabled={isAddingCollectible}
            onClick={() => {
              resetInputs()
              onClose()
            }}
          />
          <Button
            label="Add"
            disabled={
              collectibleInfoResponse === undefined || !collectibleInfoResponse.isOwner || isAddingCollectible
            }
            variant="primary"
            size="md"
            shape="square"
            onClick={handleAdd}
          />
        </Box>
      </Box>
    </Card>
  )
}
