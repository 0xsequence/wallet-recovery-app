import { Box, Button, Text, CheckmarkIcon } from "@0xsequence/design-system"
import { Network } from "@0xsequence/wallet-primitives"

interface PayloadActionButtonProps {
  isPending: boolean
  hash: string | null
  status: string | undefined
  opStatus: string | null | undefined
  isExecuted: boolean
  isLocked: boolean
  readyToExecute: boolean
  hasEnoughBalance: boolean
  selectedExternalProvider: any
  chainId: number
  onExecute: () => void
}

export function PayloadActionButton({
  isPending,
  hash,
  status,
  opStatus,
  isExecuted,
  isLocked,
  readyToExecute,
  hasEnoughBalance,
  selectedExternalProvider,
  chainId,
  onExecute
}: PayloadActionButtonProps) {
  const explorerUrl = hash ? getTransactionExplorerUrl(hash, chainId) : null

  // Show success state
  if (status === 'final' && opStatus === 'confirmed' && explorerUrl) {
    return (
      <Box flexDirection="column" gap="1" alignItems="center">
        <Text variant="small" fontWeight="bold" color="text80" flexDirection="row" gap="1" alignItems="center">
          <CheckmarkIcon width="14" height="14" color="positive" /> Recovery completed
        </Text>
        {explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="primary"
              size="sm"
              shape="square"
              label="View on explorer"
            />
          </a>
        )}
      </Box>
    )
  }

  // Show executing state
  if (isPending && !hash) {
    return (
      <Button
        variant="primary"
        size="sm"
        shape="square"
        label="Executing..."
        disabled={true}
      />
    )
  }

  // Show execute button
  if (!isPending && !hash) {
    return (
      <Button
        variant="primary"
        size="sm"
        shape="square"
        onClick={onExecute}
        label={
          isExecuted 
            ? "Executed" 
            : isLocked 
              ? "Locked" 
              : selectedExternalProvider 
                ? "Execute" 
                : "Connect wallet"
        }
        disabled={!readyToExecute || isExecuted || !hasEnoughBalance}
      />
    )
  }

  return null
}

function getTransactionExplorerUrl(hash: string, chainId: number): string | undefined {
  const network = Network.getNetworkFromChainId(chainId)
  const blockExplorer = network?.blockExplorer
  if (!blockExplorer) {
    return undefined
  }
  return `${blockExplorer.url}tx/${hash}`
}
