import { Box, Button, Text } from '@0xsequence/design-system'

import networkIcon from '~/assets/images/chain.svg'
import externalArrowIcon from '~/assets/images/external-link-arrow.svg'
import sequenceRecoveryLogo from '~/assets/images/sequence-wallet-recovery.svg'

export default function RecoveryHeader({ handleNetworkModal }: { handleNetworkModal: () => void }) {
  return (
    <Box
      background="backgroundPrimary"
      flexDirection="row"
      style={{ height: '60px' }}
      width="full"
      justifyContent="space-between"
      alignItems="center"
    >
      <Box marginX="5">
        <img src={sequenceRecoveryLogo} alt="Sequence Recovery Wallet Logo" height="28px" />
      </Box>
      <Box flexDirection="row" alignItems="center" gap="5" style={{ marginRight: '80px' }}>
        <Button
          label={
            <Box flexDirection="row" alignItems="center" gap="2">
              <img src={externalArrowIcon} alt="External Arrow Icon" height="20px" />
              <Text variant="medium" lineHeight="5" color="text50">
                Docs
              </Text>
            </Box>
          }
          variant="text"
          onClick={() => window.open('https://docs.sequence.xyz/')}
        />
        <Button
          label={
            <Box flexDirection="row" alignItems="center" gap="2">
              <img src={networkIcon} alt="Network Icon" height="20px" />
              <Text variant="medium" lineHeight="5" color="text50">
                Networks
              </Text>
            </Box>
          }
          variant="text"
          onClick={() => handleNetworkModal()}
        />
      </Box>
    </Box>
  )
}
