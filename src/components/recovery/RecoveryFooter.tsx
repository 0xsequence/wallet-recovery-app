import { Box, Button, Text } from '@0xsequence/design-system'

export default function RecoveryFooter() {
  return (
    <Box justifyContent="flex-end" width="full" position="absolute" bottom="0" padding="10">
      <Button
        label={
          <Box>
            <Text variant="small" fontWeight="bold" color="text50">
              Learn more
            </Text>
          </Box>
        }
        variant="text"
        //TODO: Change link
        onClick={() => window.open('https://docs.sequence.xyz/')}
      />
    </Box>
  )
}
