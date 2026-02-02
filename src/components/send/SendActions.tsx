import { Button, Spinner, Text } from '@0xsequence/design-system'

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
    <div className='flex flex-col gap-2'>
      <div className='flex flex-row items-center justify-end gap-2'>
        <Button
          size="md"
          shape="square"
          disabled={isWaitingForSignature}
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          size="md"
          shape="square"
          disabled={isDisabled}
          onClick={onRecover}
        >
          {isWaitingForSignature ? (
            <div className='flex flex-row items-center gap-2'>
              <Spinner />
              <Text>Continue with {connectedWalletName}</Text>
            </div>
          ) : (
            'Recover'
          )}
        </Button>
      </div>

      {isRejected && (
        <Text variant="small" color="negative" className='text-center pt-2'>
          You need to sign the transaction to proceed
        </Text>
      )}

      {insufficientBalance && (
        <Text variant="small" color="warning" className='text-center pt-2'>
          Insufficient balance for this transaction
        </Text>
      )}
    </div>
  )
}
