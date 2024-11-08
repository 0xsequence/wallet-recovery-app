import { Box, Button, TextInput, useToast } from '@0xsequence/design-system'
import { NetworkType } from '@0xsequence/network'
import { ChangeEvent, useState } from 'react'

import { useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

export default function AddNetwork({ onClose }: { onClose: () => void }) {
  const networkStore = useStore(NetworkStore)

  const toast = useToast()

  const [chainId, setChainId] = useState<string | undefined>()
  const [networkName, setNetworkName] = useState<string | undefined>()
  const [rpcUrl, setRpcUrl] = useState<string | undefined>()
  const [blockExplorerUrl, setBlockExplorerUrl] = useState<string | undefined>()
  const [tokenName, setTokenName] = useState<string | undefined>()
  const [tokenSymbol, setTokenSymbol] = useState<string | undefined>()

  const handleAdd = async () => {
    if (chainId && networkName && rpcUrl) {
      await networkStore.addNetwork({
        chainId: Number(chainId),
        name: networkName,
        title: networkName,
        type: NetworkType.MAINNET,
        rpcUrl,
        blockExplorer: blockExplorerUrl ? { rootUrl: blockExplorerUrl } : undefined,
        nativeToken: {
          name: tokenName || 'Ether',
          symbol: tokenSymbol || 'ETH',
          decimals: 18
        }
      })
    } else {
      throw new Error('Please fill in all required fields, marked with *')
    }
  }

  const resetInputs = () => {
    setChainId(undefined)
    setNetworkName(undefined)
    setRpcUrl(undefined)
    setBlockExplorerUrl(undefined)
    setTokenName(undefined)
    setTokenSymbol(undefined)
  }

  return (
    <Box flexDirection="column" width="full" marginTop="4" gap="4">
      <TextInput
        width="full"
        label="Chain ID*"
        labelLocation="left"
        name="chainId"
        value={chainId ?? ''}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => {
          setChainId(ev.target.value)
        }}
      />
      <TextInput
        width="full"
        label="Network Name*"
        labelLocation="left"
        name="networkName"
        value={networkName ?? ''}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => {
          setNetworkName(ev.target.value)
        }}
      />
      <TextInput
        width="full"
        label="RPC URL*"
        labelLocation="left"
        name="rpcUrl"
        value={rpcUrl ?? ''}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => {
          setRpcUrl(ev.target.value)
        }}
      />
      <TextInput
        width="full"
        label="Block explorer URL (optional)"
        labelLocation="left"
        name="rpcUrl"
        value={blockExplorerUrl ?? ''}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => {
          setBlockExplorerUrl(ev.target.value)
        }}
      />
      <TextInput
        width="full"
        label="Native Token Name (default ETH)"
        labelLocation="left"
        name="tokenName"
        value={tokenName ?? ''}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => {
          setTokenName(ev.target.value)
        }}
      />
      <TextInput
        width="full"
        label="Native Token Symbol (default ETH)"
        labelLocation="left"
        name="tokenSymbol"
        value={tokenSymbol ?? ''}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => {
          setTokenSymbol(ev.target.value)
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
            try {
              await handleAdd()
              toast({
                variant: 'success',
                title: 'Network added',
                description: `You can now use ${networkName} network`
              })
              resetInputs()
              onClose()
            } catch (err: any) {
              toast({ variant: 'error', title: 'Could not add network', description: err.message })
              console.error(err)
            }
          }}
        />
      </Box>
    </Box>
  )
}
