import { Box, Button, Divider, Text, TextInput } from '@0xsequence/design-system'
import { NetworkConfig } from '@0xsequence/network'
import { ChangeEvent, useEffect, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore, createDebugLocalRelayer } from '~/stores/NetworkStore'

export default function NetworkItem({ network }: { network: NetworkConfig }) {
  const networkStore = useStore(NetworkStore)

  const userAdditions = useObservable(networkStore.userAdditionNetworkChainIds)
  const isUserAddition = userAdditions.includes(network.chainId)

  useEffect(() => {
    if (rpcUrl !== network.rpcUrl || blockExplorerUrl !== network.blockExplorer?.rootUrl) {
      setRpcUrl(network.rpcUrl)
      setBlockExplorerUrl(network.blockExplorer?.rootUrl ?? '')
    }
  }, [network])

  const hasPreviousEdit = networkStore.editedNetworkChainIds.get().includes(network.chainId)

  const [rpcUrl, setRpcUrl] = useState(network.rpcUrl)
  const [blockExplorerUrl, setBlockExplorerUrl] = useState(network.blockExplorer?.rootUrl ?? '')

  const hasPendingChanges = rpcUrl !== network.rpcUrl || blockExplorerUrl !== network.blockExplorer?.rootUrl

  return (
    <Box flexDirection="column" gap="2">
      <Text fontWeight="bold" color="text100">
        {network.title}
      </Text>
      <TextInput
        label="RPC URL"
        labelLocation="left"
        name="rpcUrl"
        spellCheck={false}
        disabled={isUserAddition}
        value={rpcUrl}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => {
          setRpcUrl(ev.target.value)
        }}
      />
      <TextInput
        label="Block Explorer URL"
        labelLocation="left"
        name="blockExplorerUrl"
        spellCheck={false}
        disabled={isUserAddition}
        value={blockExplorerUrl}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => {
          setBlockExplorerUrl(ev.target.value)
        }}
      />
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
                  networkStore.editNetwork(updated)
                }}
              />
            )}
          </>
        </Box>
      )}
      <Divider />
    </Box>
  )
}
