import { AddIcon, Box, Button, Divider } from '@0xsequence/design-system'

export default function NetworkFooter() {
  return (
    <Box flexDirection="column" width="full" position="absolute" bottom="0" background="backgroundPrimary">
      <Divider marginY="0" />
      <Box alignSelf="flex-end" padding="5" gap="2">
        <Button leftIcon={AddIcon} label="Add Network" shape="square"></Button>
        <Button label="Confirm" variant="primary" shape="square" />
      </Box>
    </Box>
  )
}
