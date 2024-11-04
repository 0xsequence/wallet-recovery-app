import { Box, Button, Card, Select, Spinner, Text, TextInput, useToast } from '@0xsequence/design-system'
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
  const isFetchingTokenInfo = useObservable(tokenStore.isFetchingTokenInfo)

  const toast = useToast()

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | undefined>()
  const [tokenAddress, setTokenAddress] = useState<string | undefined>()

  const [tokenInfo, setTokenInfo] = useState<UserAddedTokenInitialInfo | undefined>()

  const [isAddingToken, setIsAddingToken] = useState(false)

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
      disabled={isAddingToken}
    >
      <Box>
        <Text variant="medium" color="text80">
          Import ERC20 Token
        </Text>
      </Box>
      <Box flexDirection="column" width="full" marginTop="4" gap="4">
        <Select
          label="Token Network"
          labelLocation="left"
          name="tokenNetwork"
          options={selectOptions}
          onValueChange={value => setSelectedNetwork(networks.find(n => n.chainId === Number(value)))}
        />

        <TextInput
          width="full"
          label="Token Address"
          labelLocation="left"
          name="tokenAddress"
          value={tokenAddress ?? ''}
          onChange={(ev: ChangeEvent<HTMLInputElement>) => {
            setTokenAddress(ev.target.value)
          }}
        />

        {isFetchingTokenInfo && (
          <Box marginTop="4" alignItems="center" justifyContent="center">
            <Spinner size="lg" />
          </Box>
        )}

        {tokenInfo && (
          <>
            <TextInput
              width="full"
              label="Token Symbol"
              labelLocation="left"
              name="tokenSymbol"
              value={tokenInfo?.symbol ?? ''}
              disabled
            />

            <TextInput
              width="full"
              label="Token Decimals"
              labelLocation="left"
              name="tokenDecimals"
              value={tokenInfo?.decimals ?? ''}
              disabled
            />
          </>
        )}

        <Box alignItems="center" justifyContent="flex-end" gap="8" marginTop="4">
          <Button
            label="Cancel"
            variant="text"
            size="md"
            shape="square"
            disabled={isAddingToken}
            onClick={() => {
              resetInputs()
              onClose()
            }}
          />
          <Button
            label="Add"
            disabled={tokenInfo === undefined || isAddingToken}
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