import { Box, Button, Divider, Text } from '@0xsequence/design-system'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import networkIcon from '~/assets/icons/chain.svg'
import externalArrowIcon from '~/assets/icons/external-link-arrow.svg'
import sequenceRecoveryLogo from '~/assets/images/sequence-wallet-recovery.svg'

import SettingsDropdownMenu from '../wallet/WalletDropdownMenu'

export default function RecoveryHeader({ handleNetworkModal }: { handleNetworkModal: () => void }) {
  const authStore = useStore(AuthStore)

  const signedIn = useObservable(authStore.accountAddress)

  return (
    <Box flexDirection="column" style={{ paddingBottom: '60px' }}>
      <Box background="backgroundPrimary" position="fixed" width="full">
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          style={{ height: '59px' }}
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
            {signedIn && <SettingsDropdownMenu />}
          </Box>
        </Box>
        <Divider marginY="0" />
      </Box>
    </Box>
  )
}