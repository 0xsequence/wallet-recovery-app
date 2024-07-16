import { Box, Button, Checkbox, Divider, Text, TextInput, useMediaQuery } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'
import { ChangeEvent, useEffect, useState } from 'react'

import { getNetworkTitle } from '~/utils/network'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export default function SendToken({
  tokenBalance,
  onClose
}: {
  tokenBalance?: TokenBalance
  onClose: (amount?: string, to?: string) => void
}) {
  const isMobile = useMediaQuery('isMobile')

  const walletStore = useStore(WalletStore)

  const [amount, setAmount] = useState<string | undefined>(undefined)
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [sendToExternalWallet, setSendToExternalWallet] = useState(false)

  useEffect(() => {
    const externalWalletAddress = walletStore.selectedExternalWalletAddress.get()

    if (sendToExternalWallet && externalWalletAddress) {
      setAddress(walletStore.selectedExternalWalletAddress.get())
    }
  }, [sendToExternalWallet])

  if (!tokenBalance) {
    return null
  }

  const networkTitle = getNetworkTitle(tokenBalance.chainId)

  return (
    <Box flexDirection="column" paddingY="5" alignItems="center">
      <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
        Sending {tokenBalance?.contractInfo?.symbol} on {networkTitle}
      </Text>

      <Divider color="gradientPrimary" width="full" height="px" />

      <Box
        style={{ minWidth: isMobile ? '100vw' : '520px' }}
        paddingX="6"
        flexDirection="column"
        gap="4"
        width="full"
        marginTop="6"
      >
        <Box flexDirection="column" gap="2">
          <TextInput
            label="Amount"
            labelLocation="top"
            name="amount"
            placeholder="Enter amount"
            value={amount ?? ''}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => {
              setAmount(ev.target.value)
            }}
            controls={
              <Button
                label="Max"
                variant="text"
                size="md"
                shape="square"
                paddingRight="2"
                onClick={() => {
                  setAmount(
                    ethers.formatUnits(tokenBalance?.balance, tokenBalance?.contractInfo?.decimals ?? 18)
                  )
                }}
              />
            }
          />
          <Text variant="small" color="text50">
            Current balance:{' '}
            {ethers.formatUnits(tokenBalance?.balance, tokenBalance?.contractInfo?.decimals ?? 18)}
          </Text>
        </Box>

        <Box flexDirection="column" gap="3">
          <TextInput
            label="To"
            labelLocation="top"
            name="to"
            placeholder="0x..."
            value={address ?? ''}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => {
              setAddress(ev.target.value)
            }}
            disabled={sendToExternalWallet}
          />
          <Checkbox
            label="Send to connected external wallet address"
            checked={sendToExternalWallet}
            onCheckedChange={checked => setSendToExternalWallet(checked === true)}
            labelLocation="right"
          />
        </Box>

        <Box alignItems="center" justifyContent="flex-end" gap="8" marginTop="4">
          <Button
            label="Cancel"
            variant="text"
            size="md"
            shape="square"
            onClick={() => {
              onClose()
            }}
          />
          <Button
            label="Send"
            variant="primary"
            size="md"
            shape="square"
            disabled={!amount || !address}
            onClick={() => {
              if (amount && address) {
                onClose(amount, address)
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
