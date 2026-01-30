import { Box, Button, CheckmarkIcon, NetworkImage, Text } from '@0xsequence/design-system'

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
    <Box flexDirection="column" padding="6" gap="4">
      <Box flexDirection="column" gap="2">
        <Box alignItems="center" justifyContent="center" gap="1">
          <Box
            width="5"
            height="5"
            justifyContent="center"
            alignItems="center"
            borderRadius="circle"
            background="backgroundRaised"
          >
            <CheckmarkIcon color="positive" />
          </Box>
          <Text variant="normal" fontWeight="bold" color="text100" textAlign="center">
            Recovery transaction enqueued
          </Text>
        </Box>

        <Text variant="small" color="text50" textAlign="center">
          Enqueued recovery transaction of {assetName}. You will be able to execute and transfer your {assetName} after 30 days.
        </Text>

        {transactionHash && (
          <Box flexDirection="column" gap="1" alignItems="center">
            {!explorerUrl && <Text variant="small" color="text50">
              txn hash: {transactionHash}
            </Text>}
          </Box>
        )}
      </Box>

      <Box justifyContent="center" gap="2">
        <Button
          label="Close"
          variant="primary"
          size="md"
          shape="square"
          onClick={onClose}
        />
        {transactionHash && explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
            <Button
              label={<Box flexDirection="row" alignItems="center" gap="1">
                <NetworkImage chainId={chainId} style={{ width: 14, height: 14 }} />
                <Text >
                  View on {networkTitle} explorer
                </Text>
              </Box>}
              variant="raised"
              size="md"
              shape="square"
            />
          </a>
        )}
      </Box>
    </Box>
  )
}
