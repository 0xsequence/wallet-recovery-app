import { Box, Button, Divider, Image, Text } from '@0xsequence/design-system'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import networkIcon from '~/assets/icons/chain.svg'
import externalArrowIcon from '~/assets/icons/external-link-arrow.svg'
import sequenceLogo from '~/assets/images/sequence-logo.svg'

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
          <Box marginX="5" gap="2">
            <Image src={sequenceLogo} height="7" />
            <Text variant="large" color="text100">
              Sequence
            </Text>
            <Text variant="large" color="text50">
              Wallet Recovery
            </Text>
          </Box>
          <Box flexDirection="row" alignItems="center" gap="5" style={{ marginRight: '80px' }}>
            <Button
              label={
                <Box flexDirection="row" alignItems="center" gap="2">
                  <Image src={externalArrowIcon} height="5" />
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
                  <Image src={networkIcon} height="5" />
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
