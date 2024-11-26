import {
  Box,
  Button,
  Card,
  Divider,
  Image,
  Select,
  Spinner,
  Text,
  TextInput,
  useToast
} from '@0xsequence/design-system'
import { NetworkConfig, NetworkType } from '@0xsequence/network'
import { BigNumberish } from 'ethers'
import { ethers } from 'ethers'
import { ChangeEvent, useEffect, useState } from 'react'

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

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | undefined>()
  const [collectibleAddress, setCollectibleAddress] = useState<string | undefined>()
  const [collectibleTokenId, setCollectibleTokenId] = useState<number | undefined>()
  const [contractType, setContractType] = useState<CollectibleContractType | undefined>()

  const [collectibleInfoResponse, setCollectibleInfoResponse] = useState<
    CollectibleInfoResponse | undefined
  >()

  const [isAddingCollectible, setIsAddingCollectible] = useState(false)
  const [tokenDirectory, setTokenDirectory] = useState<string | undefined>()

  useEffect(() => {
    if (selectedNetwork) {
      setTokenDirectory(networks.find(n => n.chainId === selectedNetwork.chainId)?.blockExplorer?.rootUrl)
    }

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
    } else {
      setCollectibleInfoResponse(undefined)
    }
  }, [selectedNetwork, collectibleAddress, collectibleTokenId, contractType])

  const selectOptions = mainnetNetworks
    .filter(network => !network.disabled)
    .map(network => ({
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
      await collectibleStore.addCollectible({
        collectibleInfoParams: {
          chainId: selectedNetwork.chainId,
          address: collectibleAddress,
          tokenId: collectibleTokenId,
          contractType
        },
        collectibleInfoResponse: collectibleInfoResponse
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
    setCollectibleAddress(undefined)
    setSelectedNetwork(undefined)
    setCollectibleTokenId(undefined)
    setContractType(undefined)
  }

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" padding="6" gap="6">
        <Text variant="large" fontWeight="bold" color="text100">
          Import ERC721 or ERC1155 Collectible
        </Text>

        <Box flexDirection="column" gap="3">
          <Box flexDirection="column" gap="1">
            <Text variant="normal" color="text100">
              Collectible Network
            </Text>

            <Select
              name="collectibleNetwork"
              options={selectOptions}
              onValueChange={value => setSelectedNetwork(networks.find(n => n.chainId === Number(value)))}
            />
          </Box>

          <Box flexDirection="column" gap="0.5">
            <Text variant="normal" color="text100">
              Collectible Address
            </Text>

            <Box flexDirection="row" gap="1" paddingBottom="0.5">
              <Text variant="normal" color="text50">
                See addresses on network's
              </Text>

              <Text
                variant="normal"
                color="text50"
                underline={!!tokenDirectory}
                cursor={tokenDirectory ? 'pointer' : 'default'}
                onClick={() => {
                  if (tokenDirectory) {
                    window.open(tokenDirectory)
                  }
                }}
              >
                directory
              </Text>
            </Box>

            <TextInput
              name="collectibleAddress"
              value={collectibleAddress ?? ''}
              onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                setCollectibleAddress(ev.target.value)
              }}
            />
          </Box>

          <Box flexDirection="column" gap="1">
            <Text variant="normal" color="text100">
              Collectible Type
            </Text>

            <Select
              name="collectibleType"
              options={[
                { value: 'ERC721', label: 'ERC721' },
                { value: 'ERC1155', label: 'ERC1155' }
              ]}
              onValueChange={value => setContractType(value as CollectibleContractType)}
            />
          </Box>

          <Box flexDirection="column" gap="0.5">
            <Text variant="normal" color="text100">
              Collectible Token ID
            </Text>

            <TextInput
              name="collectibleTokenId"
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
          </Box>
        </Box>

        {isFetchingCollectibleInfo && (
          <Box alignItems="center" justifyContent="center">
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
          <Card flexDirection="row" gap="6">
            <Image src={collectibleInfoResponse.image} style={{ width: '120px', height: 'auto' }} />

            <Box flexDirection="column" gap="2">
              <Text variant="medium" color="text100">
                {collectibleInfoResponse.name ?? ''}
              </Text>
              <>
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
              </>
            </Box>
          </Card>
        )}
      </Box>

      <Divider marginY="0" />
      <Box flexDirection="row" justifyContent="flex-end" padding="6" gap="2">
        <Button label="Cancel" size="md" shape="square" onClick={onClose} />

        <Button
          label="Add Collectible"
          variant="primary"
          shape="square"
          disabled={collectibleInfoResponse === undefined || isAddingCollectible}
          onClick={() => {
            handleAdd()
          }}
        />
      </Box>
    </Box>
  )
}
