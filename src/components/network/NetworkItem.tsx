import {
  Box,
  Button,
  Card,
  ChevronDownIcon,
  Collapsible,
  CollapsiblePrimitive,
  Text,
  TextInput
} from '@0xsequence/design-system'
import { NetworkConfig } from '@0xsequence/network'
import { ChangeEvent, useEffect, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore, createDebugLocalRelayer } from '~/stores/NetworkStore'

import FilledCheckBox from '../checkboxes/FilledCheckBox'

export default function NetworkItem({ network }: { network: NetworkConfig }) {
  const networkStore = useStore(NetworkStore)

  const userAdditions = useObservable(networkStore.userAdditionNetworkChainIds)
  const isUserAddition = userAdditions.includes(network.chainId)

  useEffect(() => {
    if (
      rpcUrl !== network.rpcUrl ||
      blockExplorerUrl !== network.blockExplorer?.rootUrl ||
      disabled !== network.disabled
    ) {
      setRpcUrl(network.rpcUrl)
      setBlockExplorerUrl(network.blockExplorer?.rootUrl ?? '')
      setDisabled(network.disabled)
    }
  }, [network])

  const hasPreviousEdit = networkStore.editedNetworkChainIds.get().includes(network.chainId)

  const [rpcUrl, setRpcUrl] = useState(network.rpcUrl)
  const [blockExplorerUrl, setBlockExplorerUrl] = useState(network.blockExplorer?.rootUrl ?? '')
  const [disabled, setDisabled] = useState(network.disabled)

  const hasPendingChanges =
    rpcUrl !== network.rpcUrl ||
    blockExplorerUrl !== network.blockExplorer?.rootUrl ||
    disabled !== network.disabled

  return (
    <Card flexDirection="column" gap="4">
      <Box flexDirection="row" gap="3">
        <Button
          variant="text"
          label={
            <Box flexDirection="row" gap="2" alignItems="center">
              <FilledCheckBox checked={!disabled} />
              <Text variant="medium" fontWeight="semibold" color="text80">
                {network.title}
              </Text>
            </Box>
          }
          onClick={() => setDisabled(!disabled)}
        ></Button>
      </Box>

      <CollapsiblePrimitive.Root>
        <CollapsiblePrimitive.Trigger
          style={{
            backgroundColor: 'inherit',
            border: 'none',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          <Box flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text variant="medium" fontWeight="bold" color={disabled ? 'borderNormal' : 'text50'}>
              Network Settings
            </Text>
            <ChevronDownIcon color={disabled ? 'text50' : 'text100'} />
          </Box>
        </CollapsiblePrimitive.Trigger>

        <CollapsiblePrimitive.Content>
          <Box flexDirection="column" paddingTop="4" gap="3">
            <Box flexDirection="column" gap="1">
              <Text variant="normal" fontWeight="medium" color="text100">
                RPC URL
              </Text>
              <TextInput
                name="rpcUrl"
                spellCheck={false}
                disabled={isUserAddition}
                value={rpcUrl ?? ''}
                onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                  setRpcUrl(ev.target.value)
                }}
              />
            </Box>
            <Box flexDirection="column" gap="1">
              <Text variant="normal" fontWeight="medium" color="text100">
                Block Explorer URL
              </Text>
              <TextInput
                name="blockExplorerUrl"
                spellCheck={false}
                disabled={isUserAddition}
                value={blockExplorerUrl ?? ''}
                onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                  setBlockExplorerUrl(ev.target.value)
                }}
              />
            </Box>
          </Box>
        </CollapsiblePrimitive.Content>
      </CollapsiblePrimitive.Root>

      {isUserAddition && (
        <Box marginTop="4" alignItems="center" justifyContent="flex-end" gap="5">
          <Text variant="small" color="text50">
            Added by you
          </Text>
          <Button
            label="Remove"
            variant="danger"
            size="md"
            shape="square"
            onClick={() => networkStore.removeNetwork(network.chainId)}
          />
        </Box>
      )}
      {(hasPendingChanges || hasPreviousEdit) && !isUserAddition && (
        <Box marginTop="4" justifyContent="flex-end" gap="3">
          <>
            {hasPreviousEdit && (
              <Button
                label="Reset to default"
                variant="danger"
                size="md"
                shape="square"
                onClick={() => networkStore.resetNetworkEdit(network.chainId)}
              />
            )}
          </>
          <>
            {hasPendingChanges && (
              <Button
                label="Save"
                variant="primary"
                size="md"
                shape="square"
                onClick={() => {
                  const updated = network
                  updated.rpcUrl = rpcUrl
                  updated.blockExplorer = { rootUrl: blockExplorerUrl }
                  updated.relayer = createDebugLocalRelayer(rpcUrl)
                  updated.disabled = disabled
                  networkStore.editNetwork(updated)
                }}
              />
            )}
          </>
        </Box>
      )}
    </Card>
  )
}
