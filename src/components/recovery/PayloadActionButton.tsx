import { Button, Text, CheckmarkIcon, Spinner } from "@0xsequence/design-system"
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
  const externalProviderName = selectedExternalProvider?.info.name

  // Show success state
  if (status === 'final' && opStatus === 'confirmed' && explorerUrl) {
    return (
      <div className='flex flex-col gap-1 items-center'>
        <Text variant="small" fontWeight="bold" color="text80" className='flex flex-row gap-1 items-center'>
          <CheckmarkIcon className='w-4 h-4 text-positive' /> Recovery completed
        </Text>
        {explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button
              variant="primary"
              size="sm"
              shape="square"
              className="w-full justify-center"
            >
              <Text variant="small" fontWeight="bold" color="text100">
                View on explorer
              </Text>
            </Button>
          </a>
        )}
      </div>
    )
  }

  // Show executing state
  if (isPending && !hash) {
    return (
      <Button
        variant="primary"
        size="sm"
        shape="square"
        disabled={true}
      >
        <Spinner size="xs" className="text-white mr-1" />

        <Text variant="small" fontWeight="bold" color="text100">
          Continue with {externalProviderName}
        </Text>
      </Button>
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
        disabled={!readyToExecute || isExecuted || !hasEnoughBalance}
      >
        <Text variant="small" fontWeight="bold" color="text100">
          {isExecuted ? "Executed" : isLocked ? "Locked" : selectedExternalProvider ? "Execute" : "Connect wallet"}
        </Text>
      </Button>
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
