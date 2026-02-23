import {
  Checkbox,
  ChevronDownIcon,
  CollapsiblePrimitive,
  NetworkImage,
  Text,
  TextInput
} from '@0xsequence/design-system'
import { NetworkConfig } from '@0xsequence/network'
import { ChangeEvent, useEffect, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'

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
    <CollapsiblePrimitive.Root className="rounded-lg border border-border-normal bg-background-secondary ">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center aspect-square pl-3">
          <Checkbox
            checked={!disabled}
            size="lg"
            className='shrink-0'
            aria-label={`${disabled ? 'Enable' : 'Disable'} ${network.title}`}
            onCheckedChange={checked => setDisabled(!(checked === true))}
          />
        </div>
        <CollapsiblePrimitive.Trigger asChild>
          <button
            type="button"
            className="flex flex-1 cursor-pointer items-start justify-between gap-2 border-none my-auto text-left p-4"
          >
            <div className="flex min-w-0 flex-row items-center gap-2">
              <NetworkImage chainId={network.chainId} size="sm" />

              <div className="flex min-w-0 flex-col gap-0.5">
                <Text
                  variant="normal"
                  fontWeight="medium"
                  color={validRpcUrl ? (isUnsaved ? 'warning' : 'text80') : 'negative'}
                  className="truncate"
                >
                  {network.title} {!validRpcUrl && '(Invalid RPC URL)'} {isUnsaved && '*'}
                </Text>

                {(hasPreviousEdit || isUserAddition) && (
                  <Text variant="xsmall" fontWeight="medium" color="text50" className="truncate">
                    {isUserAddition ? `(Chain Id "${network.chainId}", added by you)` : '(edited)'}
                  </Text>
                )}
              </div>
            </div>

            <ChevronDownIcon color={disabled ? 'text50' : 'text100'} />
          </button>
        </CollapsiblePrimitive.Trigger>
      </div>

      <CollapsiblePrimitive.Content>
        <div className="flex flex-col gap-3 pt-3">
          <div className="flex flex-col gap-1">
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
          <div className="flex flex-col gap-1">
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
  )
}
