import { Box, Button, Divider, Text, TextInput } from '@0xsequence/design-system'
import { NetworkConfig } from '@0xsequence/network'
import { ChangeEvent, useEffect, useState } from 'react'

import { useStore } from '../stores'
import { NetworkStore, createDebugLocalRelayer } from '../stores/NetworkStore'

export default function NetworkItem({ network }: { network: NetworkConfig }) {
  const networkStore = useStore(NetworkStore)

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
        value={blockExplorerUrl}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => {
          setBlockExplorerUrl(ev.target.value)
        }}
      />
      {(hasPendingChanges || hasPreviousEdit) && (
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
