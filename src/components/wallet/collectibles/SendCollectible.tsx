import { Box, Button, Divider, Text, useMediaQuery } from '@0xsequence/design-system'
import { BigNumberish } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { useObservable } from 'micro-observables'
import { isAddress } from 'viem'

import { getNetworkTitle } from '~/utils/network'
import { formatBalance, hasSufficientBalance } from '~/utils/balance'
import { getTransactionExplorerUrl } from '~/utils/transaction'

import { useStore } from '~/stores'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import { WalletStore } from '~/stores/WalletStore'

import { FilledCheckBox } from '~/components/misc'
import { AmountInput } from '~/components/send/AmountInput'
import { AddressInput } from '~/components/send/AddressInput'
import { TransactionSuccess } from '~/components/send/TransactionSuccess'
import { SendActions } from '~/components/send/SendActions'

import { useSendForm } from '~/hooks/use-send-form'
import { useTransactionStatus } from '~/hooks/use-transaction-status'
import { useModalDismissibility } from '~/hooks/use-modal-dismissibility'

export default function SendCollectible({
  collectibleInfo,
  onClose,
  onRecover,
  onDismissibleChange
}: {
  collectibleInfo?: CollectibleInfo
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
    if (!amount || !collectibleInfo) {
      return false
    }

    // ERC721 always has balance of 1
    if (collectibleInfo.collectibleInfoParams.contractType === 'ERC721') {
      return false
    }

    const balance = collectibleInfo.collectibleInfoResponse.balance ?? 0n
    const decimals = collectibleInfo.collectibleInfoResponse.decimals ?? 0
    return !hasSufficientBalance(amount, balance as BigNumberish, decimals)
  }, [amount, collectibleInfo])

  // Set default values: maximum balance/1 for ERC721 and external wallet address
  useEffect(() => {
    if (collectibleInfo) {
      const isERC721 = collectibleInfo.collectibleInfoParams.contractType === 'ERC721'

      if (isERC721) {
        setAmount('1')
      } else {
        const balance = collectibleInfo.collectibleInfoResponse.balance
        const decimals = collectibleInfo.collectibleInfoResponse.decimals ?? 0
        if (balance !== null && balance !== undefined) {
          const maxBalance = formatBalance(balance as BigNumberish, decimals)
          setAmount(maxBalance)
        }
      }

      const externalWalletAddress = walletStore.selectedExternalWalletAddress.get()
      if (externalWalletAddress) {
        setToAddress(externalWalletAddress)
      }
    }
  }, [collectibleInfo, setAmount, setToAddress, walletStore])

  if (!collectibleInfo) {
    return null
  }

  const isERC721 = collectibleInfo.collectibleInfoParams.contractType === 'ERC721'
  const networkTitle = getNetworkTitle(collectibleInfo.collectibleInfoParams.chainId)
  const connectedWalletName = selectedExternalProvider?.info.name || 'wallet'
  const decimals = collectibleInfo.collectibleInfoResponse.decimals ?? 0
  const balance = collectibleInfo.collectibleInfoResponse.balance
  const currentBalance = balance !== null && balance !== undefined
    ? formatBalance(balance as BigNumberish, decimals)
    : '0'

  const explorerUrl = transaction?.hash && collectibleInfo?.collectibleInfoParams.chainId
    ? getTransactionExplorerUrl(transaction.hash, collectibleInfo.collectibleInfoParams.chainId)
    : undefined

  const handleMaxClick = () => {
    if (balance !== null && balance !== undefined) {
      setAmount(formatBalance(balance as BigNumberish, decimals))
    }
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
    <Box style={{ minWidth: isMobile ? '100vw' : '500px' }}>
      <Box flexDirection="column" gap="6" padding="6">
        <Text variant="large" fontWeight="bold" color="text100">
          Sending {collectibleInfo?.collectibleInfoResponse?.name} on {networkTitle}
        </Text>

        <Box flexDirection="column" gap="3">
          <AmountInput
            label="Amount"
            value={isERC721 ? '1' : amount ?? ''}
            currentBalance={currentBalance}
            disabled={isERC721}
            insufficientBalance={insufficientBalance}
            showMaxButton={!isERC721}
            onChange={setAmount}
            onMaxClick={!isERC721 ? handleMaxClick : undefined}
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
        </Box>

        <Button
          variant="text"
          label={
            <Box flexDirection="row" alignItems="center" gap="2">
              <FilledCheckBox checked={sendToExternalWallet} size="md" />
              <Text variant="small" color="text80">
                Send to connected external wallet address
              </Text>
            </Box>
          }
          onClick={() => setSendToExternalWallet(!sendToExternalWallet)}
        />
      </Box>

      <Divider marginY="0" />

      {isSigned ? (
        <TransactionSuccess
          assetName={collectibleInfo?.collectibleInfoResponse?.name}
          networkTitle={networkTitle}
          chainId={collectibleInfo.collectibleInfoParams.chainId}
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
    </Box>
  )
}
