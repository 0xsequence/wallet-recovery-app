import { Box, Button, Card, Select, Text, TextInput, useToast } from '@0xsequence/design-system'
import { ContractType } from '@0xsequence/indexer'
import { NetworkConfig, NetworkType } from '@0xsequence/network'
import { ChangeEvent, useState } from 'react'

import { useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'
import { TokenStore } from '~/stores/TokenStore'

export default function AddToken({ onClose }: { onClose: () => void }) {
  const networkStore = useStore(NetworkStore)
  const networks = networkStore.networks.get()
  const mainnetNetworks = networks.filter(network => network.type === NetworkType.MAINNET)

  const tokenStore = useStore(TokenStore)

  const toast = useToast()

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | undefined>()
  const [tokenAddress, setTokenAddress] = useState<string | undefined>()

  const selectOptions = mainnetNetworks.map(network => ({
    label: network.title,
    value: network.chainId.toString()
  }))

  const handleAdd = async () => {
    // TODO: add validation
    if (selectedNetwork && tokenAddress) {
      await tokenStore.addToken({
        chainId: selectedNetwork.chainId,
        address: tokenAddress,
        contractType: ContractType.ERC20
      })
      toast({
        variant: 'success',
        title: 'Token added'
      })
      resetInputs()
      onClose()
    }
  }

  const resetInputs = () => {
    setTokenAddress(undefined)
    setSelectedNetwork(undefined)
  }

  return (
    <Card
      flexDirection="column"
      paddingY="4"
      paddingX="8"
      borderRadius="md"
      width="full"
      height="full"
      alignItems="center"
    >
      <Box>
        <Text variant="medium" color="text80">
          Import Token
        </Text>
      </Box>
      <Box flexDirection="column" width="full" marginTop="4" gap="4">
        <Select
          name="Token Network"
          label="Token Network"
          labelLocation="left"
          options={selectOptions}
          onValueChange={value => setSelectedNetwork(networks.find(n => n.chainId === Number(value)))}
        />

        <TextInput
          width="full"
          label="Token Address"
          labelLocation="left"
          name="tokenAddress"
          value={tokenAddress}
          onChange={(ev: ChangeEvent<HTMLInputElement>) => {
            setTokenAddress(ev.target.value)
          }}
        />

        <Box alignItems="center" justifyContent="flex-end" gap="8" marginTop="4">
          <Button
            label="Cancel"
            variant="text"
            size="md"
            shape="square"
            onClick={() => {
              resetInputs()
              onClose()
            }}
          />
          <Button label="Add" variant="primary" size="md" shape="square" onClick={handleAdd} />
        </Box>
      </Box>
    </Card>
  )
}
