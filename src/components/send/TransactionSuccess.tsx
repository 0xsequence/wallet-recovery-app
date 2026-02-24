import { Button, CheckmarkIcon, NetworkImage, Text } from '@0xsequence/design-system'

export type TransactionSuccessProps = {
  assetName?: string
  networkTitle: string
  chainId: number
  transactionHash?: string
  explorerUrl?: string
  onClose: () => void
}

export function TransactionSuccess({
  assetName,
  networkTitle,
  chainId,
  transactionHash,
  explorerUrl,
  onClose
}: TransactionSuccessProps) {
  return (
    <div className='flex flex-col gap-4 p-6 pt-0'>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-row items-center justify-center gap-1'>
          <div
            className='w-5 h-5 rounded-full bg-backgroundRaised flex items-center justify-center'
          >
            <CheckmarkIcon className='w-4 h-4 text-positive' />
          </div>
          <Text variant="normal" fontWeight="bold" color="text100" className='text-center'>
            Recovery transaction enqueued
          </Text>
        </div>

        <Text variant="small" color="text50" className='text-center' >
          Enqueued recovery transaction of {assetName}. You will be able to execute and transfer your {assetName} after 30 days.
        </Text>

        {transactionHash && (
          <div className='flex flex-col gap-1 items-center'>
            {!explorerUrl && <Text variant="small" color="text50">
              txn hash: {transactionHash}
            </Text>}
          </div>
        )}
      </div>

      <div className='flex flex-row items-center justify-center gap-2'>
        <Button
          variant="primary"
          size="md"
          shape="square"
          onClick={onClose}
        >
          Close
        </Button>

        {transactionHash && explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="secondary"
              size="md"
              shape="square"
            >
              <div className='flex flex-row items-center gap-1'>
                <NetworkImage chainId={chainId} style={{ width: 14, height: 14 }} />
                <Text >
                  View on {networkTitle} explorer
                </Text>
              </div>
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}
