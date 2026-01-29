import { Box, Text, CheckmarkIcon, Tooltip } from "@0xsequence/design-system"
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
    <Box flexDirection="column" gap="1" flexGrow={"1"}>
      <Box gap="4" alignItems="center" flexDirection="row">
        <Tooltip message={payloadId}>
          <Text variant="normal" fontWeight="bold" color="text80" style={{ fontFamily: 'monospace', textDecoration: 'underline' }}>
            {payloadId.slice(0, 6)}...{payloadId.slice(-4)}
          </Text>
        </Tooltip>
        <NetworkTag chainId={chainId} renderImage={true} />
        {isExecuted && (
          <Box flexDirection="row" gap="1" alignItems="center">
            <CheckmarkIcon width="14" height="14" color="positive" />
            <Text variant="small" fontWeight="medium" color="positive">
              Executed
            </Text>
          </Box>
        )}
      </Box>

      <Box flexDirection="column" gap="0.5">
        <Box flexDirection="row" gap="1" alignItems="center">
          <Text variant="small" fontWeight="medium" color="text50">
            Queued at:
          </Text>
          <Text variant="small" fontWeight="medium" color="text80">
            {formatDateTime(startDate)}
          </Text>
        </Box>
        {!isExecuted && (
          <Box flexDirection="row" gap="1" alignItems="center">
            <Text variant="small" fontWeight="medium" color="text50">
              {readyToExecute ? (
                <Box flexDirection="row" gap="1" alignItems="center">
                  <CheckmarkIcon width="12" height="12" color="positive" /> Ready to execute
                </Box>
              ) : (
                'Locked until:'
              )}
            </Text>
            {!readyToExecute && (
              <Text variant="small" fontWeight="medium" color="text80">
                {formatDateTime(endDate)}
              </Text>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
