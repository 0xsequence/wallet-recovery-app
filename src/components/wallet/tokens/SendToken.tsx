import { Button, Checkbox, Text, useMediaQuery } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { useObservable } from 'micro-observables'
import { useEffect, useMemo, useState } from 'react'
import { isAddress } from 'viem'

import { getNetworkTitle } from '~/utils/network'
import { formatBalance, hasSufficientBalance } from '~/utils/balance'
import { getTransactionExplorerUrl } from '~/utils/transaction'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

import { AmountInput } from '~/components/send/AmountInput'
import { AddressInput } from '~/components/send/AddressInput'
import { TransactionSuccess } from '~/components/send/TransactionSuccess'
import { SendActions } from '~/components/send/SendActions'

import { useSendForm } from '~/hooks/use-send-form'
import { useTransactionStatus } from '~/hooks/use-transaction-status'
import { useModalDismissibility } from '~/hooks/use-modal-dismissibility'

export default function SendToken({
  tokenBalance,
  onClose,
  onRecover,
  onDismissibleChange
}: {
  tokenBalance?: TokenBalance
  onClose: () => void
  onRecover: (props: { amount?: string; to?: string }) => Promise<string | undefined | void>
  onDismissibleChange?: (isDismissible: boolean) => void
}) {
  const isMobile = useMediaQuery('isMobile')

  const walletStore = useStore(WalletStore)
  const selectedExternalProvider = useObservable(walletStore.selectedExternalProvider)

  const [recoveryPayloadId, setRecoveryPayloadId] = useState<string | undefined>(undefined)
  const [isWaitingForSignature, setIsWaitingForSignature] = useState(false)

  const {
    amount,
    toAddress,
    sendToExternalWallet,
    isSendingToExternalWallet,
    setAmount,
    setToAddress,
    setSendToExternalWallet
  } = useSendForm()

  const { transaction, isSigned, isRejected } = useTransactionStatus(
    recoveryPayloadId,
    isWaitingForSignature,
    setIsWaitingForSignature
  )

  useModalDismissibility(recoveryPayloadId, isWaitingForSignature, onDismissibleChange)

  const insufficientBalance = useMemo(() => {
    if (!amount || !tokenBalance) {
      return false
    }
    return !hasSufficientBalance(amount, tokenBalance.balance, tokenBalance.contractInfo?.decimals ?? 18)
  }, [amount, tokenBalance])

  // Set default values: maximum balance and external wallet address
  useEffect(() => {
    if (tokenBalance) {
      const maxBalance = formatBalance(tokenBalance.balance, tokenBalance.contractInfo?.decimals ?? 18)
      setAmount(maxBalance)

      const externalWalletAddress = walletStore.selectedExternalWalletAddress.get()
      if (externalWalletAddress) {
        setToAddress(externalWalletAddress)
      }
    }
  }, [tokenBalance, setAmount, setToAddress, walletStore])

  if (!tokenBalance) {
    return null
  }

  const decimals = tokenBalance.contractInfo?.decimals ?? 18
  const networkTitle = getNetworkTitle(tokenBalance.chainId)
  const connectedWalletName = selectedExternalProvider?.info.name || 'wallet'
  const currentBalance = formatBalance(tokenBalance.balance, decimals)

  const explorerUrl = transaction?.hash && tokenBalance?.chainId
    ? getTransactionExplorerUrl(transaction.hash, tokenBalance.chainId)
    : undefined

  const handleMaxClick = () => {
    setAmount(formatBalance(tokenBalance.balance, decimals))
  }

  const handleRecover = async () => {
    if (toAddress && amount) {
      setRecoveryPayloadId(undefined)
      setIsWaitingForSignature(true)

      try {
        const payloadId = await onRecover({ amount, to: toAddress })
        if (payloadId) {
          setRecoveryPayloadId(payloadId)
        } else {
          setIsWaitingForSignature(false)
        }
      } catch (error) {
        setIsWaitingForSignature(false)
      }
    }
  }

  const handleClose = () => {
    setRecoveryPayloadId(undefined)
    setIsWaitingForSignature(false)
    onClose()
  }

  return (
    <div className='min-w-[500px]' style={{ minWidth: isMobile ? '100vw' : '500px' }}>
      <div className='flex flex-col gap-6 p-6'>
        <Text variant="large" fontWeight="bold" color="text100">
          Sending {tokenBalance?.contractInfo?.symbol} on {networkTitle}
        </Text>

        <div className='flex flex-col gap-3'>
          <AmountInput
            label="Amount"
            value={amount ?? ''}
            currentBalance={currentBalance}
            symbol={tokenBalance?.contractInfo?.symbol}
            insufficientBalance={insufficientBalance}
            onChange={setAmount}
            onMaxClick={handleMaxClick}
          />

          <AddressInput
            label="To"
            value={toAddress ?? ''}
            disabled={sendToExternalWallet}
            helperText={
              isSendingToExternalWallet && selectedExternalProvider
                ? `You're sending to your ${selectedExternalProvider.info.name} wallet`
                : undefined
            }
            onChange={setToAddress}
          />
        </div>

        <Button
          variant="text"
          onClick={() => setSendToExternalWallet(!sendToExternalWallet)}
        >
          <div className='flex flex-row items-center gap-2'>
            <Checkbox checked={sendToExternalWallet} />
            <Text variant="small" color="text80">
              Send to connected external wallet address
            </Text>
          </div>
        </Button>
      </div>

      <div className='my-0' />

      {isSigned ? (
        <TransactionSuccess
          assetName={tokenBalance?.contractInfo?.symbol}
          networkTitle={networkTitle}
          chainId={tokenBalance.chainId}
          transactionHash={transaction?.hash}
          explorerUrl={explorerUrl}
          onClose={handleClose}
        />
      ) : (
        <SendActions
          isWaitingForSignature={isWaitingForSignature}
          isRejected={isRejected}
          insufficientBalance={insufficientBalance}
          isDisabled={
            isWaitingForSignature ||
            !toAddress ||
            !amount ||
            insufficientBalance ||
            !isAddress(toAddress)
          }
          connectedWalletName={connectedWalletName}
          onCancel={handleClose}
          onRecover={handleRecover}
        />
      )}
    </div>
  )
}
