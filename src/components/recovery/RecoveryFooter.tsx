import { Box, Button, Text } from '@0xsequence/design-system'
import { Link } from 'react-router-dom'

export default function RecoveryFooter() {
  return (
    <Box justifyContent="flex-end" width="full" position="absolute" bottom="0" padding="5">
      <Button
        label={
          <Box>
            <Text variant="small" fontWeight="bold" color="text50">
              Learn more
            </Text>
          </Box>
        }
        variant="medium"
        //TODO: Change link
        as={Link}
        to="/"
      />
    </Box>
  )
}
