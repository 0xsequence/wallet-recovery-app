import { Box, Button, Select, Text, TextInput, useToast } from '@0xsequence/design-system'
import { NetworkConfig, NetworkType } from '@0xsequence/network'
import { ChangeEvent, useState } from 'react'

import { useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

export default function AddToken({ onClose }: { onClose: () => void }) {
  const networkStore = useStore(NetworkStore)
  const networks = networkStore.networks.get()
  const mainnetNetworks = networks.filter(network => network.type === NetworkType.MAINNET)

  const toast = useToast()

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | undefined>()
  const [tokenAddress, setTokenAddress] = useState<string | undefined>()

  const selectOptions = mainnetNetworks.map(network => ({
    label: network.title,
    value: network.chainId.toString()
  }))

  const handleAdd = async () => {
    // TODO: add validation
  }

  const resetInputs = () => {
    setTokenAddress(undefined)
    setSelectedNetwork(undefined)
  }

  return (
    <Box
      flexDirection="column"
      paddingY="4"
      paddingX="8"
      background="backgroundSecondary"
      borderRadius="md"
      width="full"
      height="full"
      alignItems="center"
    >
      <Box>
        <Text variant="large" color="text80">
          Import Token
        </Text>
      </Box>
      <Box flexDirection="column" width="full" marginTop="4" gap="4">
        <Select name="Token Network" label="Token Network" labelLocation="left" options={selectOptions} />

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
          <Button
            label="Add"
            variant="primary"
            size="md"
            shape="square"
            onClick={async () => {
              // try {
              //   await handleAdd()
              //   toast({
              //     variant: 'success',
              //     title: 'Network added',
              //     description: `You can now use ${networkName} network`
              //   })
              //   resetInputs()
              //   onClose()
              // } catch (err: any) {
              //   toast({ variant: 'error', title: 'Could not add network', description: err.message })
              //   console.error(err)
              // }
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
