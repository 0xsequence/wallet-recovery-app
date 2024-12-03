import { Box, Text, truncateAddress } from '@0xsequence/design-system'
import { useState } from 'react'

import FilledRoundCheckBox, { ROUND_CHECKBOX_SIZE } from '~/components/helpers/FilledRoundCheckBox'

export default function WalletList({
  possibleWallets,
  handleSelectWallet
}: {
  possibleWallets: string[]
  handleSelectWallet: (wallet: string) => void
}) {
  const [selectedWallet, setSelectedWallet] = useState<string>(possibleWallets[0])

  const gapWidth = 2

  return (
    <Box flexDirection="column" gap={`${gapWidth}`}>
      <Text variant="normal" fontWeight="medium" color="text80">
        Wallets found
      </Text>
      {possibleWallets.map(wallet => {
        return (
          <Box key={wallet}>
            <Box
              flexDirection="row"
              alignItems="center"
              gap={`${gapWidth}`}
              style={{ height: '52px' }}
              cursor="pointer"
              onClick={() => {
                setSelectedWallet(wallet)
                handleSelectWallet(wallet)
              }}
            >
              <Box style={{ minWidth: `${ROUND_CHECKBOX_SIZE * 4}px` }}>
                <FilledRoundCheckBox checked={selectedWallet === wallet} />
              </Box>

              <Box
                background="buttonGlass"
                borderRadius="md"
                alignItems="center"
                height="full"
                paddingX="4"
                width="full"
              >
                <Text
                  variant='normal'
                  fontWeight="medium"
                  color="text100"
                  style={{ fontFamily: 'monospace' }}
                >
                  {truncateAddress(wallet, 20, 6)}
                </Text>
              </Box>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
