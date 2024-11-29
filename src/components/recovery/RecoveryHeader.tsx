import { Box, Button, Divider, Image, Text } from '@0xsequence/design-system'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import SettingsDropdownMenu from '~/components/wallet/WalletDropdownMenu'

import networkIcon from '~/assets/icons/chain.svg'
import externalArrowIcon from '~/assets/icons/external-link-arrow.svg'
import SequenceRecoveryLogo from '~/assets/images/sequence-wallet-recovery.svg'

export const RECOVERY_HEADER_HEIGHT = 60

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
          style={{ height: RECOVERY_HEADER_HEIGHT - 1 }}
        >
          <Image src={SequenceRecoveryLogo} paddingLeft="5" />
          <Box flexDirection="row" alignItems="center" gap="5" style={{ marginRight: '80px' }}>
            <Button
              label={
                <Box flexDirection="row" alignItems="center" gap="2">
                  <Image src={externalArrowIcon} height="5" />
                  <Text variant="normal" fontWeight="bold" color="text50">
                    Docs
                  </Text>
                </Box>
              }
              variant="text"
              // TODO: change link
              onClick={() => window.open('https://docs.sequence.xyz/')}
            />
            <Button
              label={
                <Box flexDirection="row" alignItems="center" gap="2">
                  <Image src={networkIcon} height="5" />
                  <Text variant="normal" fontWeight="bold" color="text50">
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
