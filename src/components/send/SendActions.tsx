import { Box, Button, Spinner, Text } from '@0xsequence/design-system'

export type SendActionsProps = {
  isWaitingForSignature: boolean
  isRejected: boolean
  insufficientBalance: boolean
  isDisabled: boolean
  connectedWalletName: string
  onCancel: () => void
  onRecover: () => void
}

export function SendActions({
  isWaitingForSignature,
  isRejected,
  insufficientBalance,
  isDisabled,
  connectedWalletName,
  onCancel,
  onRecover
}: SendActionsProps) {
  return (
    <Box flexDirection="column" padding="6" gap="2">
      <Box alignItems="center" justifyContent="flex-end" gap="2">
        <Button
          label="Cancel"
          size="md"
          shape="square"
          disabled={isWaitingForSignature}
          onClick={onCancel}
        />

        <Button
          label={
            isWaitingForSignature ? (
              <Box flexDirection="row" alignItems="center" gap="2">
                <Spinner width="4" height="4" />
                <Text>Continue with {connectedWalletName}</Text>
              </Box>
            ) : (
              'Recover'
            )
          }
          variant="primary"
          size="md"
          shape="square"
          disabled={isDisabled}
          onClick={onRecover}
        />
      </Box>

      {isRejected && (
        <Text variant="small" color="negative" textAlign="center" paddingTop="2">
          You need to sign the transaction to proceed
        </Text>
      )}

      {insufficientBalance && (
        <Text variant="small" color="warning" textAlign="center" paddingTop="2">
          Insufficient balance for this transaction
        </Text>
      )}
    </Box>
  )
}
