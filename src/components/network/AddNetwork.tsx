import { Button, ChevronLeftIcon, IconButton, Text, TextInput, useToast } from '@0xsequence/design-system'
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
    <div className='flex flex-col w-full'>
      <div className='flex flex-row items-center p-6 gap-4'>
        <IconButton icon={ChevronLeftIcon} onClick={onClose} size="sm" />

        <Text variant="large" fontWeight="bold" color="text100">
          Add Network
        </Text>
      </div>

      <div className='flex flex-col p-6 gap-6'>
        <div className='flex flex-col gap-2'>
          <Text variant="normal" fontWeight="medium" color="text100">
            Chain ID *
          </Text>

          <TextInput
            name="chainId"
            spellCheck={false}
            value={chainId ?? ''}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => {
              setChainId(ev.target.value)
            }}
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Text variant="normal" fontWeight="medium" color="text100">
            Network Name *
          </Text>

          <TextInput
            name="networkName"
            spellCheck={false}
            value={networkName ?? ''}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => {
              setNetworkName(ev.target.value)
            }}
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Text variant="normal" fontWeight="medium" color="text100">
            RPC URL *
          </Text>

          <TextInput
            name="rpcUrl"
            spellCheck={false}
            value={rpcUrl ?? ''}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => {
              setRpcUrl(ev.target.value)
            }}
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Text variant="normal" fontWeight="medium" color="text100">
            Block Explorer URL (Optional)
          </Text>

          <TextInput
            name="blockExplorerUrl"
            spellCheck={false}
            value={blockExplorerUrl ?? ''}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => {
              setBlockExplorerUrl(ev.target.value)
            }}
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Text variant="normal" fontWeight="medium" color="text100">
            Native Token Name (default: ETH)
          </Text>

          <TextInput
            name="tokenName"
            spellCheck={false}
            value={tokenName ?? ''}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => {
              setTokenName(ev.target.value)
            }}
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Text variant="normal" fontWeight="medium" color="text100">
            Native Token Symbol (default: ETH)
          </Text>

          <TextInput
            name="tokenSymbol"
            spellCheck={false}
            value={tokenSymbol ?? ''}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => {
              setTokenSymbol(ev.target.value)
            }}
          />
        </div>
      </div>

      <div className='absolute bottom-0 right-0 w-full'>
        <div className='h-0.5 bg-backgroundBackdrop' />
        <div className='flex flex-row justify-end items-center gap-2 p-6'>
          <Button
            shape="square"
            onClick={() => {
              resetInputs()
              onClose()
            }}
          >
            <Text variant="normal" fontWeight="medium" color="text100">Cancel</Text>
          </Button>
          <Button
            variant="primary"
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
          >
            <Text variant="normal" fontWeight="medium" color="text100">Confirm</Text>
          </Button>
        </div>
      </div>
    </div>
  )
}
