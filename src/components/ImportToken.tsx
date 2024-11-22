import {
  Box,
  Button,
  Card,
  Divider,
  Select,
  Spinner,
  Text,
  TextInput,
  useToast
} from '@0xsequence/design-system'
import { ContractType } from '@0xsequence/indexer'
import { NetworkConfig, NetworkType } from '@0xsequence/network'
import { ChangeEvent, useEffect, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'
import { TokenStore, UserAddedTokenInitialInfo } from '~/stores/TokenStore'

export default function ImportToken({ onClose }: { onClose: () => void }) {
  const networkStore = useStore(NetworkStore)
  const networks = networkStore.networks.get()
  const mainnetNetworks = networks.filter(network => network.type === NetworkType.MAINNET)

  const tokenStore = useStore(TokenStore)

  const toast = useToast()

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | undefined>()
  const [tokenAddress, setTokenAddress] = useState<string | undefined>()

  const [tokenInfo, setTokenInfo] = useState<UserAddedTokenInitialInfo | undefined>()

  const [isAddingToken, setIsAddingToken] = useState(false)

  const [isNativeToken, setIsNativeToken] = useState(false)

  useEffect(() => {
    if (selectedNetwork && tokenAddress) {
      tokenStore.getTokenInfo(selectedNetwork.chainId, tokenAddress).then(tokenInfo => {
        setTokenInfo(tokenInfo)
      })
    } else {
      setTokenInfo(undefined)
    }
  }, [selectedNetwork, tokenAddress])

  const selectOptions = mainnetNetworks.map(network => ({
    label: network.title,
    value: network.chainId.toString()
  }))

  const handleAdd = async () => {
    // TODO: add form validation
    if (selectedNetwork && tokenAddress && tokenInfo) {
      setIsAddingToken(true)
      await tokenStore.addToken({
        chainId: selectedNetwork.chainId,
        address: tokenAddress,
        contractType: ContractType.ERC20,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals
      })
      setIsAddingToken(false)
      toast({
        variant: 'success',
        title: isNativeToken ? 'Native token added sucessfully' : 'ERC20 token added sucessfully',
        description: "You'll be able to see this token on your browser as long as you don't clear your cache."
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
    <Box flexDirection="column">
      <Box flexDirection="column" padding="6" gap="6">
        <Text variant="large" fontWeight="bold" color="text100">
          Import Token
        </Text>
        <Box flexDirection="column">
          <Box flexDirection="row" style={{ paddingBottom: '5px' }}>
            <Box cursor="pointer" onClick={() => setIsNativeToken(false)}>
              <Text
                variant="normal"
                fontWeight="semibold"
                color={!isNativeToken ? 'text100' : 'text50'}
                paddingY="2"
                paddingX="4"
              >
                ERC20 Token
              </Text>

              {!isNativeToken && (
                <Divider color="white" height="0.5" position="relative" marginY="0" style={{ top: '6px' }} />
              )}
            </Box>

            <Box cursor="pointer" onClick={() => setIsNativeToken(true)}>
              <Text
                variant="normal"
                fontWeight="semibold"
                color={isNativeToken ? 'text100' : 'text50'}
                paddingY="2"
                paddingX="4"
              >
                Native Token
              </Text>

              {isNativeToken && (
                <Divider color="white" height="0.5" position="relative" marginY="0" style={{ top: '6px' }} />
              )}
            </Box>
          </Box>

          <Divider marginY="0" />
        </Box>
        <Box flexDirection="column" gap="3">
          <Box flexDirection="column" gap="1">
            <Text variant="normal" color="text100">
              Token Network
            </Text>

            <Select
              name="tokenNetwork"
              options={selectOptions}
              onValueChange={value => setSelectedNetwork(networks.find(n => n.chainId === Number(value)))}
            />
          </Box>

          <Box flexDirection="column" gap="0.5">
            <Text variant="normal" color="text100">
              Token Address
            </Text>

            <Box flexDirection="row" gap="1" paddingBottom="0.5">
              <Text variant="normal" color="text50">
                See addresses on network's
              </Text>
              <Text
                variant="normal"
                color="text50"
                underline
                cursor="pointer"
                // TODO: add variable link for network directory
                onClick={() => window.open('https://docs.sequence.xyz/')}
              >
                directory
              </Text>
            </Box>

            <TextInput
              name="tokenAddress"
              value={tokenAddress ?? ''}
              onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                setTokenAddress(ev.target.value)
              }}
            />
          </Box>
        </Box>
      </Box>
      <Divider marginY="0" />
      <Box flexDirection="row" justifyContent="flex-end" padding="6" gap="2">
        <Button label="Cancel" size="md" shape="square" onClick={onClose} />

        <Button
          label="Add Token"
          variant="primary"
          shape="square"
          disabled={tokenInfo === undefined || isAddingToken}
          onClick={() => {
            handleAdd()
          }}
        />
      </Box>
    </Box>
  )
}
