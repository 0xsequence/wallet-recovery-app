import {
  Button,
  ChevronDownIcon,
  CollapsiblePrimitive,
  Text,
  TextInput
} from '@0xsequence/design-system'
import { NetworkConfig } from '@0xsequence/network'
import { ChangeEvent, useEffect, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

import { FilledCheckBox } from '~/components/misc'

export default function NetworkItem({ network }: { network: NetworkConfig }) {
  const networkStore = useStore(NetworkStore)

  const isUnsaved = useObservable(networkStore.unsavedNetworkEditChainIds).includes(network.chainId)

  const userAdditions = useObservable(networkStore.userAdditionNetworkChainIds)
  const isUserAddition = userAdditions.includes(network.chainId)

  const hasPreviousEdit = networkStore.editedNetworkChainIds.get().includes(network.chainId)

  const [rpcUrl, setRpcUrl] = useState(network.rpcUrl)
  const [blockExplorerUrl, setBlockExplorerUrl] = useState(network.blockExplorer?.rootUrl ?? '')
  const [disabled, setDisabled] = useState(network.disabled)

  const [validRpcUrl, setValidRpcUrl] = useState(true)

  useEffect(() => {
    const checkRpcUrl = async () => {
      const rpcCheck = await networkStore.isValidRpcUrl(rpcUrl)
      setValidRpcUrl(rpcCheck)
    }
    checkRpcUrl()
  }, [rpcUrl])

  useEffect(() => {
    if (
      rpcUrl !== network.rpcUrl ||
      blockExplorerUrl !== network.blockExplorer?.rootUrl ||
      disabled !== network.disabled ||
      isUnsaved
    ) {
      const updated = { ...network }
      updated.rpcUrl = rpcUrl
      updated.blockExplorer = { rootUrl: blockExplorerUrl }
      // updated.relayer = createDebugLocalRelayer(rpcUrl)
      updated.disabled = disabled
      networkStore.addUnsavedNetworkEdit(updated)
    }
  }, [rpcUrl, blockExplorerUrl, disabled])

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-row gap-3'>
        <Button
          variant="text"
          onClick={() => setDisabled(!disabled)}
        >
          <div className='flex flex-row gap-2 items-center'>
            <FilledCheckBox checked={!disabled} />

            <Text
              variant="normal"
              fontWeight="medium"
              color={validRpcUrl ? (isUnsaved ? 'warning' : 'text80') : 'negative'}
            >
              {network.title} {!validRpcUrl && '(Invalid RPC URL)'} {isUnsaved && '*'}
            </Text>

            {(hasPreviousEdit || isUserAddition) && (
              <Text variant="normal" fontWeight="medium" color="text50">
                {isUserAddition ? `(Chain Id "${network.chainId}", added by you)` : '(edited)'}
              </Text>
            )}
          </div>
        </Button>
      </div>

      <CollapsiblePrimitive.Root>
        <CollapsiblePrimitive.Trigger
          style={{
            backgroundColor: 'inherit',
            border: 'none',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          <div className='flex flex-row justify-between items-center'>
            <Text variant="normal" fontWeight="bold" color={disabled ? 'text50' : 'text100'}>
              Network Settings
            </Text>

            <ChevronDownIcon color={disabled ? 'text50' : 'text100'} />
          </div>
        </CollapsiblePrimitive.Trigger>

        <CollapsiblePrimitive.Content>
          <div className='flex flex-col gap-3 p-4'>
            <div className='flex flex-col gap-1'>
              <Text variant="normal" fontWeight="medium" color="text100">
                RPC URL
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
            <div className='flex flex-col gap-1'>
              <Text variant="normal" fontWeight="medium" color="text100">
                Block Explorer URL
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
          </div>
        </CollapsiblePrimitive.Content>
      </CollapsiblePrimitive.Root>
    </div>
  )
}
