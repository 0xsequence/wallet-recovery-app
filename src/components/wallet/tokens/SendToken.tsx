import { Box, Button, CheckmarkIcon, Divider, NetworkImage, Spinner, Text, TextInput, useMediaQuery, WarningIcon } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { Network } from '@0xsequence/wallet-primitives'
import { ethers } from 'ethers'
import { useObservable } from 'micro-observables'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'

import { getNetworkTitle } from '~/utils/network'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

import { FilledCheckBox } from '~/components/misc'
import { useTxHashesStore } from '~/hooks/use-tx-hash-store'

export default function SendToken({
  tokenBalance,
  onClose,
  onRecover,
  onDismissibleChange
}: {
  tokenBalance?: TokenBalance
  onClose: () => void
  onRecover: (amount?: string) => Promise<string | undefined | void>
  onDismissibleChange?: (isDismissible: boolean) => void
}) {
  const isMobile = useMediaQuery('isMobile')

  const walletStore = useStore(WalletStore)
  const selectedExternalProvider = useObservable(walletStore.selectedExternalProvider)
  const selectedExternalWalletAddress = useObservable(walletStore.selectedExternalWalletAddress)
  const txHashes = useTxHashesStore()

  const [amount, setAmount] = useState<string | undefined>(undefined)
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [sendToExternalWallet, setSendToExternalWallet] = useState(true)
  const [recoveryPayloadId, setRecoveryPayloadId] = useState<string | undefined>(undefined)
  const [isWaitingForSignature, setIsWaitingForSignature] = useState(false)

  // Check if the address matches the external wallet address (case-insensitive)
  const isSendingToExternalWallet =
    address &&
    selectedExternalWalletAddress &&
    address.toLowerCase() === selectedExternalWalletAddress.toLowerCase()

  // Check if user has sufficient balance
  const insufficientBalance = useMemo(() => {
    if (!amount || !tokenBalance) {
      return false
    }

    try {
      const amountBigInt = ethers.parseUnits(amount, tokenBalance.contractInfo?.decimals ?? 18)
      return amountBigInt > BigInt(tokenBalance.balance)
    } catch (e) {
      // Invalid amount format
      return false
    }
  }, [amount, tokenBalance])

  // Set default values: maximum balance and external wallet address
  useEffect(() => {
    if (tokenBalance) {
      // Set amount to maximum balance
      const maxBalance = ethers.formatUnits(tokenBalance.balance, tokenBalance.contractInfo?.decimals ?? 18)
      setAmount(maxBalance)

      // Set address to external wallet address if available
      const externalWalletAddress = walletStore.selectedExternalWalletAddress.get()
      if (externalWalletAddress) {
        setAddress(externalWalletAddress)
      }
    }
  }, [tokenBalance])

  useEffect(() => {
    const externalWalletAddress = walletStore.selectedExternalWalletAddress.get()

    if (sendToExternalWallet && externalWalletAddress) {
      setAddress(walletStore.selectedExternalWalletAddress.get())
    }
  }, [sendToExternalWallet])

  // Monitor transaction status
  useEffect(() => {
    if (!recoveryPayloadId) {
      return
    }

    const transaction = txHashes.get(recoveryPayloadId)
    const status = transaction?.status

    // Ignore 'preparing' status to avoid race conditions
    if (status === 'pending' || status === 'success') {
      setIsWaitingForSignature(false)
    } else if (status === 'cancelled' || status === 'error') {
      setIsWaitingForSignature(false)
    }
  }, [recoveryPayloadId, txHashes.values])

  // Update modal dismissibility based on waiting state
  useEffect(() => {
    if (onDismissibleChange) {
      const transaction = recoveryPayloadId ? txHashes.get(recoveryPayloadId) : undefined
      const txStatus = transaction?.status
      const hasFinalStatus = txStatus === 'pending' || txStatus === 'success' || txStatus === 'cancelled' || txStatus === 'error'

      // Modal should be non-dismissible when waiting for signature or when we have a recoveryPayloadId without final status
      const shouldBeDismissible = !isWaitingForSignature && (!recoveryPayloadId || hasFinalStatus)
      onDismissibleChange(shouldBeDismissible)
    }
  }, [isWaitingForSignature, recoveryPayloadId, onDismissibleChange, txHashes.values])

  // Poll for transaction status updates
  useEffect(() => {
    if (!recoveryPayloadId || !isWaitingForSignature) {
      return
    }

    const interval = setInterval(() => {
      const transaction = txHashes.get(recoveryPayloadId)
      const status = transaction?.status

      if (status === 'pending' || status === 'success') {
        setIsWaitingForSignature(false)
        clearInterval(interval)
      } else if (status === 'cancelled' || status === 'error') {
        setIsWaitingForSignature(false)
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [recoveryPayloadId, isWaitingForSignature, txHashes])

  if (!tokenBalance) {
    return null
  }

  const networkTitle = getNetworkTitle(tokenBalance.chainId)
  const transaction = recoveryPayloadId ? txHashes.get(recoveryPayloadId) : undefined
  const txStatus = transaction?.status
  const isSigned = txStatus === 'pending' || txStatus === 'success'
  const isRejected = txStatus === 'cancelled' || txStatus === 'error'
  const connectedWalletName = selectedExternalProvider?.info.name || 'wallet'

  // Get explorer URL for transaction hash
  const getTransactionExplorerUrl = (hash: string, chainId: number): string | undefined => {
    const network = Network.getNetworkFromChainId(chainId)
    const blockExplorer = network?.blockExplorer
    if (!blockExplorer) {
      return undefined
    }
    return `${blockExplorer.url}tx/${hash}`
  }

  const explorerUrl = transaction?.hash && tokenBalance?.chainId
    ? getTransactionExplorerUrl(transaction.hash, tokenBalance.chainId)
    : undefined

  return (
    <Box style={{ minWidth: isMobile ? '100vw' : '500px' }}>
      <Box flexDirection="column" gap="6" padding="6">
        <Text variant="large" fontWeight="bold" color="text100">
          Sending {tokenBalance?.contractInfo?.symbol} on {networkTitle}
        </Text>

        <Box flexDirection="column" gap="3">
          <Box flexDirection="column" gap="1">
            <Box flexDirection="column" gap="0.5">
              <Text variant="normal" fontWeight="medium" color="text80">
                Amount
              </Text>

              <Text variant="normal" fontWeight="medium" color="text80">
                Current Balance:{' '}
                {ethers.formatUnits(tokenBalance?.balance, tokenBalance?.contractInfo?.decimals ?? 18)}
              </Text>
            </Box>

            <TextInput
              name="amount"
              value={amount ?? ''}
              onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                setAmount(ev.target.value)
              }}
              controls={
                <Button
                  label="Max"
                  size="xs"
                  shape="square"
                  onClick={() => {
                    setAmount(
                      ethers.formatUnits(tokenBalance?.balance, tokenBalance?.contractInfo?.decimals ?? 18)
                    )
                  }}
                />
              }
            />

            {insufficientBalance && (
              <Box flexDirection="row" alignItems="center" gap="1" paddingTop="1">
                <WarningIcon color="warning" size="xs" />
                <Text variant="small" color="warning">
                  Insufficient balance. Your current balance is{' '}
                  {ethers.formatUnits(tokenBalance?.balance, tokenBalance?.contractInfo?.decimals ?? 18)}{' '}
                  {tokenBalance?.contractInfo?.symbol}
                </Text>
              </Box>
            )}
          </Box>

          <Box flexDirection="column" gap="1">
            <Text variant="normal" fontWeight="medium" color="text80">
              To
            </Text>

            <TextInput
              name="to"
              value={address ?? ''}
              placeholder="0x..."
              disabled={sendToExternalWallet}
              onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                setAddress(ev.target.value)
              }}
            />
            {isSendingToExternalWallet && selectedExternalProvider && (
              <Text variant="small" color="text50">
                You're sending to your {selectedExternalProvider.info.name} wallet
              </Text>
            )}
          </Box>
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
        <Box flexDirection="column" padding="6" gap="4">
          <Box flexDirection="column" gap="2">
            <Box alignItems="center" justifyContent="center" gap="1">
              <Box width="5" height="5" justifyContent="center" alignItems="center" borderRadius="circle" background="backgroundRaised">
                <CheckmarkIcon color="positive" />
              </Box>
              <Text variant="normal" fontWeight="bold" color="text100" textAlign="center">
                Recovery transaction enqueued
              </Text>
            </Box>
            <Text variant="small" color="text50" textAlign="center">
              Enqueued recovery transaction of {tokenBalance?.contractInfo?.symbol}. You will be able to execute and transfer your {tokenBalance?.contractInfo?.symbol}s after 30 days.
            </Text>
            {transaction?.hash && (
              <Box flexDirection="column" gap="1" alignItems="center">
                {explorerUrl ? (
                  <Box display={"flex"} alignItems={"center"} gap={"1"}>
                    <NetworkImage style={{ width: 14, height: 14 }} chainId={tokenBalance.chainId} />
                    <Text
                      variant="small"
                      color="text80"
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => window.open(explorerUrl, '_blank')}
                    >
                      View on {networkTitle} explorer
                    </Text>
                  </Box>
                ) : (
                  <Text variant="small" color="text50">
                    txn hash: {transaction.hash}
                  </Text>
                )}
              </Box>
            )}
          </Box>
          <Box justifyContent="center">
            <Button
              label="Close"
              variant="primary"
              size="md"
              shape="square"
              onClick={() => {
                setRecoveryPayloadId(undefined)
                setIsWaitingForSignature(false)
                onClose()
              }}
            />
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column" padding="6" gap="2">
          <Box alignItems="center" justifyContent="flex-end" gap="2">
            <Button
              label="Cancel"
              size="md"
              shape="square"
              disabled={isWaitingForSignature}
              onClick={() => {
                setRecoveryPayloadId(undefined)
                setIsWaitingForSignature(false)
                onClose()
              }}
            />

            <Button
              label={isWaitingForSignature ? <Box flexDirection="row" alignItems="center" gap="2"><Spinner width="4" height="4" /> <Text>Continue with {connectedWalletName}</Text></Box> : 'Recover'}
              variant="primary"
              size="md"
              shape="square"
              disabled={
                isWaitingForSignature ||
                !address ||
                !amount ||
                insufficientBalance
              }
              onClick={async () => {
                if (address && amount) {
                  // Clear previous recovery payload ID to avoid stale state
                  setRecoveryPayloadId(undefined)
                  setIsWaitingForSignature(true)
                  try {
                    const payloadId = await onRecover(amount)
                    if (payloadId) {
                      setRecoveryPayloadId(payloadId)
                    } else {
                      setIsWaitingForSignature(false)
                    }
                  } catch (error) {
                    setIsWaitingForSignature(false)
                  }
                }
              }}
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
      )}
    </Box>
  )
}
