import { Box, Button, Checkbox, Divider, Text, TextInput, useMediaQuery } from '@0xsequence/design-system'
import { ethers } from 'ethers'
import { BigNumberish } from 'ethers'
import { ChangeEvent, useEffect, useState } from 'react'

import { getNetworkTitle } from '~/utils/network'

import { useStore } from '~/stores'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import { WalletStore } from '~/stores/WalletStore'

import FilledCheckBox from '~/components/helpers/FilledCheckBox'

export default function SendCollectible({
  collectibleInfo,
  onClose
}: {
  collectibleInfo?: CollectibleInfo
  onClose: (to?: string, amount?: string) => void
}) {
  const isMobile = useMediaQuery('isMobile')

  const walletStore = useStore(WalletStore)

  const [amount, setAmount] = useState<string | undefined>(undefined)
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [sendToExternalWallet, setSendToExternalWallet] = useState(false)
  const [isExternalWalletSelected, setIsExternalWalletSelected] = useState(false)

  useEffect(() => {
    const externalWalletAddress = walletStore.selectedExternalWalletAddress.get()

    if (sendToExternalWallet && externalWalletAddress) {
      setAddress(walletStore.selectedExternalWalletAddress.get())
    }
  }, [sendToExternalWallet])

  useEffect(() => {
    setIsExternalWalletSelected(walletStore.selectedExternalWalletAddress.get() !== undefined)
  }, [walletStore.selectedExternalWalletAddress])

  if (!collectibleInfo) {
    return null
  }

  const isERC721 = collectibleInfo.collectibleInfoParams.contractType === 'ERC721'

  const networkTitle = getNetworkTitle(collectibleInfo.collectibleInfoParams.chainId)

  return (
    <Box style={{ minWidth: isMobile ? '100vw' : '500px' }}>
      <Box flexDirection="column" gap="6" padding="6">
        <Text variant="large" fontWeight="bold" color="text100">
          Sending {collectibleInfo?.collectibleInfoResponse?.name} on {networkTitle}
        </Text>

        <Box flexDirection="column" gap="3">
          <Box flexDirection="column" gap="1">
            <Box flexDirection="column" gap="0.5">
              <Text variant="normal" color="text100">
                Amount
              </Text>

              <Text variant="normal" color="text50">
                Current Balance:{' '}
                {ethers.formatUnits(
                  collectibleInfo?.collectibleInfoResponse?.balance as BigNumberish,
                  collectibleInfo?.collectibleInfoResponse?.decimals ?? 18
                )}
              </Text>
            </Box>

            <TextInput
              name="amount"
              value={isERC721 ? '1' : amount ?? ''}
              disabled={isERC721}
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
                      ethers.formatUnits(
                        collectibleInfo?.collectibleInfoResponse?.balance as BigNumberish,
                        collectibleInfo?.collectibleInfoResponse?.decimals ?? 18
                      )
                    )
                  }}
                />
              }
            />
          </Box>

          <Box flexDirection="column" gap="1">
            <Text variant="normal" color="text100">
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
              <Text variant="small" color="text100">
                Send to connected external wallet address
              </Text>
            </Box>
          }
          onClick={() => setSendToExternalWallet(!sendToExternalWallet)}
        />
      </Box>

      <Divider marginY="0" />

      <Box alignItems="center" justifyContent="space-between" padding="6">
        <Button
          variant="text"
          label={
            <Box flexDirection="row" alignItems="center" gap="2">
              <FilledCheckBox checked={false} size="md" />
              <Text variant="normal" color="text100">
                Label goes here
              </Text>
            </Box>
          }
        />

        <Box gap="2">
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
            disabled={isERC721 ? !address : !address || !amount}
            onClick={() => {
              if (address && amount) {
                onClose(address, amount)
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
