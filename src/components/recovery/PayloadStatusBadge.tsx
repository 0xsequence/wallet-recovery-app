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
    <div className='flex flex-col gap-1 flex-grow-1'>
      <div className='flex flex-row gap-4 items-center'>
        <Tooltip message={payloadId}>
          <Text variant="normal" fontWeight="bold" color="text80" style={{ fontFamily: 'monospace', textDecoration: 'underline' }}>
            {payloadId.slice(0, 6)}...{payloadId.slice(-4)}
          </Text>
        </Tooltip>
        <NetworkTag chainId={chainId} renderImage={true} />
        {isExecuted && (
          <div className='flex flex-row gap-1 items-center'>
            <CheckmarkIcon width="14" height="14" color="positive" />
            <Text variant="small" fontWeight="medium" color="positive">
              Executed
            </Text>
          </div>
        )}
      </div>

      <div className='flex flex-col gap-0.5'>
        <div className='flex flex-row gap-1 items-center'>
          <Text variant="small" fontWeight="medium" color="text50">
            Queued at:
          </Text>
          <Text variant="small" fontWeight="medium" color="text80">
            {formatDateTime(startDate)}
          </Text>
        </div>
        {!isExecuted && (
          <div className='flex flex-row gap-1 items-center'>
            <Text variant="small" fontWeight="medium" color="text50">
              {readyToExecute ? (
                <div className='flex flex-row gap-1 items-center'>
                  <CheckmarkIcon width="12" height="12" color="positive" /> Ready to execute
                </div>
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
