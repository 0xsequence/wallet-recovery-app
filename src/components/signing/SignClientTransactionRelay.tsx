import { commons } from '@0xsequence/core'
import {
  Box,
  Button,
  Card,
  Collapsible,
  Divider,
  ExternalLinkIcon,
  IconButton,
  Text
} from '@0xsequence/design-system'
import { ethers } from 'ethers'
import { useEffect } from 'react'

import { getNetworkTitle } from '~/utils/network'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export default function SignClientTransactionRelay({
  onClose,
  handleSignTxn
}: {
  onClose: () => void
  handleSignTxn: (details: {
    txn: ethers.Transaction[] | ethers.TransactionRequest[]
    chainId?: number
    origin?: string
    projectAccessKey?: string
  }) => void
}) {
  const walletStore = useStore(WalletStore)

  const details = walletStore.toSignTxnDetails.get()

  useEffect(() => {
    if (details) {
      handleSignTxn(details)
    }
  }, [details])

  return (
    <Box>
      {details && (
        <>
          <Box flexDirection="column" gap="6" padding="6">
            <Text variant="large" fontWeight="bold" color="text100">
              Waiting for external wallet confirmation
            </Text>

            <Box flexDirection="column" gap="3">
              <Card flexDirection="row" justifyContent="space-between" alignItems="center">
                <Text variant="normal" fontWeight="semibold" color="text100">
                  Origin
                </Text>
                <Box flexDirection="row" alignItems="center" gap="2">
                  <Text variant="normal" fontWeight="semibold" color="text100">
                    {details?.origin?.split('//')[1]}
                  </Text>
                  <IconButton
                    size="xs"
                    icon={ExternalLinkIcon}
                    onClick={() => window.open(details?.origin, '_blank')}
                    style={{ width: '24px', height: '24px' }}
                  />
                </Box>
              </Card>
              <Card flexDirection="row" justifyContent="space-between">
                <Text variant="normal" fontWeight="semibold" color="text100">
                  Network
                </Text>
                <Text variant="normal" fontWeight="semibold" color="text100">
                  {getNetworkTitle(Number(details.chainId))}
                </Text>
              </Card>
              <Collapsible label={`Transaction Data`}>
                <Box flexDirection="column" gap="2">
                  {details.txn.map((txn: commons.transaction.Transactionish, idx: number) => (
                    <Card key={idx}>
                      <Text
                        variant="code"
                        color="text80"
                        style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}
                      >
                        {JSON.stringify(txn, null, 4) || `Native token transfer`}
                      </Text>
                    </Card>
                  ))}
                </Box>
              </Collapsible>
            </Box>
          </Box>
          <Divider marginY="0" />

          <Box alignItems="center" justifyContent="flex-end" padding="6" gap="2">
            <Button
              label="Ignore transaction"
              size="md"
              shape="square"
              onClick={() => {
                onClose()
              }}
            />
          </Box>
        </>
      )}
    </Box>
  )
}
