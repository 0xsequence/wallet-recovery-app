import { Box, BoxProps, Image, Text } from '@0xsequence/design-system'

import sequenceLogo from '~/assets/images/sequence-logo.svg'

export default function SequenceLogo({
  variant = 'md',
  ...rest
}: {
  variant?: 'md' | 'lg'
} & BoxProps) {
  return (
    <Box gap="2" {...rest}>
      <Image src={sequenceLogo} height={variant === 'md' ? '7' : '10'} />
      <Text variant={variant === 'md' ? 'large' : 'xlarge'} fontWeight="bold" color="text100">
        Sequence
      </Text>
      <Text variant={variant === 'md' ? 'large' : 'xlarge'} fontWeight="bold" color="text50">
        Wallet Recovery
      </Text>
    </Box>
  )
}
