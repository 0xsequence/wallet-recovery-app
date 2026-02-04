import { Text, CheckmarkIcon, Tooltip } from "@0xsequence/design-system"
import NetworkTag from "../network/NetworkTag"

interface PayloadStatusBadgeProps {
  payloadId: string
  chainId: number
  isExecuted: boolean
  startDate: Date
  endDate: Date
  isLocked: boolean
  readyToExecute: boolean
}

export function PayloadStatusBadge({
  payloadId,
  chainId,
  isExecuted,
  startDate,
  endDate,
  isLocked: _isLocked,
  readyToExecute
}: PayloadStatusBadgeProps) {
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className='flex flex-col gap-1 flex-grow-1 min-w-0'>
      <div className='flex flex-col gap-2 sm:flex-row sm:gap-4 sm:items-center min-w-0'>
        <Tooltip message={payloadId}>
          <Text
            variant="normal"
            fontWeight="bold"
            color="text80"
            style={{ fontFamily: 'monospace', textDecoration: 'underline' }}
            className="max-w-full"
          >
            {payloadId.slice(0, 6)}...{payloadId.slice(-4)}
          </Text>
        </Tooltip>
        <NetworkTag chainId={chainId} renderImage={true} />
        {isExecuted && (
          <div className='flex flex-row gap-1 items-center'>
            <div className='p-1 bg-positive/10 rounded-full flex items-center justify-center'>
              <CheckmarkIcon className="w-4 h-4 text-positive" />
            </div>
            <Text variant="small" fontWeight="medium" color="positive">
              Executed
            </Text>
          </div>
        )}
      </div>

      <div className='flex flex-col gap-0.5'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-center'>
          <Text variant="small" fontWeight="medium" color="text50">
            Queued at:
          </Text>
          <Text variant="small" fontWeight="medium" color="text80">
            {formatDateTime(startDate)}
          </Text>
        </div>
        {!isExecuted && (
          <div className='flex flex-col gap-1 sm:flex-row sm:items-center'>
            <Text variant="small" fontWeight="medium" color="text50">
              {readyToExecute ? (
                <span className='flex flex-row gap-1 items-center'>
                  <CheckmarkIcon className='w-4 h-4 text-positive' /> Ready to execute
                </span>
              ) : (
                'Locked until:'
              )}
            </Text>
            {!readyToExecute && (
              <Text variant="small" fontWeight="medium" color="text80">
                {formatDateTime(endDate)}
              </Text>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
