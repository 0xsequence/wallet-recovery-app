import { Box, Button, Divider, Text, TextInput, useMediaQuery } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'
import { ChangeEvent, useEffect, useState } from 'react'

import { getNetworkTitle } from '~/utils/network'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

import FilledCheckBox from '~/components/helpers/FilledCheckBox'

export default function SendToken({
  tokenBalance,
  onClose
}: {
  tokenBalance?: TokenBalance
  onClose: (to?: string, amount?: string) => void
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
          </Box>
        </Box>

        <Button
          variant="text"
          label={
            <Box flexDirection="row" alignItems="center" gap="2">
              <FilledCheckBox checked={sendToExternalWallet} size="md" />
              <Text variant="small" fontWeight="medium" color="text80">
                Send to connected external wallet address
              </Text>
            </Box>
          }
          onClick={() => setSendToExternalWallet(!sendToExternalWallet)}
        />
      </Box>

      <Divider marginY="0" />

      <Box alignItems="center" justifyContent="flex-end" padding="6" gap="2">
        <Button
          label="Cancel"
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
          disabled={!address || !amount}
          onClick={() => {
            if (address && amount) {
              onClose(address, amount)
            }
          }}
        />
      </Box>
    </Box>
  )
}
