import { commons } from '@0xsequence/core'
import {
  Button,
  Card,
  Collapsible,
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
    <div>
      {details && (
        <>
          <div className='flex flex-col gap-6 p-6'>
            <Text variant="large" fontWeight="bold" color="text100">
              Waiting for external wallet confirmation
            </Text>

            <div className='flex flex-col gap-3'>
              <Card className='flex flex-row justify-between items-center'>
                <Text variant="normal" fontWeight="medium" color="text100">
                  Origin
                </Text>
                <div className='flex flex-row items-center gap-2'>
                  <Text variant="normal" fontWeight="medium" color="text100">
                    {details?.origin?.split('//')[1]}
                  </Text>
                  <IconButton
                    size="xs"
                    icon={ExternalLinkIcon}
                    onClick={() => window.open(details?.origin, '_blank')}
                    style={{ width: '24px', height: '24px' }}
                  />
                </div>
              </Card>
              <Card className='flex flex-row justify-between'>
                <Text variant="normal" fontWeight="medium" color="text100">
                  Network
                </Text>
                <Text variant="normal" fontWeight="medium" color="text100">
                  {getNetworkTitle(Number(details.chainId))}
                </Text>
              </Card>
              <Collapsible label={`Transaction Data`}>
                <div className='flex flex-col gap-2'>
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
                </div>
              </Collapsible>
            </div>
          </div>
          <div className='h-0 my-0' />

          <div className='flex flex-row items-center justify-end gap-2 p-6'>
            <Button
              size="md"
              shape="square"
              onClick={() => {
                onClose()
              }}
            >
              Ignore transaction
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
