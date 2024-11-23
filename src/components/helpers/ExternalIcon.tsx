import { Box, BoxProps, Image } from '@0xsequence/design-system'

export const ExternalIcon = ({
  src,
  background = 'text80'
}: {
  src: string
  background?: BoxProps['background']
}) => {
  return (
    <Box
      justifyContent="center"
      alignItems="center"
      background={background}
      borderRadius="sm"
      style={{ height: '44px', width: '44px' }}
    >
      <Image width="9" height="9" src={src} borderRadius="xs" />
    </Box>
  )
}
