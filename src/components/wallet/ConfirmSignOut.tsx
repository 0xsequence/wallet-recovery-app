import { Box, Button, Text } from '@0xsequence/design-system'

export default function ConfirmSignOut({ handleSignOut }: { handleSignOut: (signOut?: boolean) => void }) {
  return (
    <Box flexDirection="column" padding="6" gap="6">
      <Text variant="large" fontWeight="bold" color="text100" marginRight="8">
        Are you sure you want to sign out?
      </Text>
      <Text variant="normal" fontWeight="medium" color="text50">
        This will disconnect all Dapps, tokens, and relay wallet connections, and you’ll need to reconnect
        them manually.
      </Text>
      <Box flexDirection="row" justifyContent="flex-end" gap="2">
        <Button label="Yes, sign out" shape="square" variant="primary" onClick={() => handleSignOut(true)} />
        <Button label="Cancel" shape="square" onClick={() => handleSignOut()} />
      </Box>
    </Box>
  )
}
