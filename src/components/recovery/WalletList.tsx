import { Box, Button, Text } from '@0xsequence/design-system'
import { useState } from 'react'

import { WALLET_WIDTH } from '~/routes/Wallet'

import FilledRoundCheckBox, { ROUND_CHECKBOX_SIZE } from '../checkboxes/FilledRoundCheckBox'

export default function WalletList({
  possibleWallets,
  handleSelectWallet
}: {
  possibleWallets: string[]
  handleSelectWallet: (wallet: string) => void
}) {
  const [selectedWallet, setSelectedWallet] = useState<string>(possibleWallets[0])

  const gapWidth = 2

  console.log('possibleWallets', possibleWallets)

  return (
    <Box flexDirection="column" gap={`${gapWidth}`}>
      <Text variant="normal" color="text100">
        Wallets found
      </Text>
      {possibleWallets.map(wallet => {
        return (
          <Box key={wallet}>
            <Button
              shape="square"
              width="full"
              variant="text"
              label={
                <Box flexDirection="row" alignItems="center" gap={`${gapWidth}`} style={{ height: '52px' }}>
                  <FilledRoundCheckBox checked={selectedWallet === wallet} />

                  <Box
                    background="buttonGlass"
                    borderRadius="md"
                    alignItems="center"
                    height="full"
                    paddingX="4"
                    style={{ width: `${WALLET_WIDTH - ROUND_CHECKBOX_SIZE * 4 - gapWidth * 4}px` }}
                  >
                    <Text variant="normal" color="text100" style={{ fontFamily: 'monospace' }}>
                      {wallet}
                    </Text>
                  </Box>
                </Box>
              }
              onClick={() => {
                setSelectedWallet(wallet)
                handleSelectWallet(wallet)
              }}
            />
          </Box>
        )
      })}
    </Box>
  )
}
