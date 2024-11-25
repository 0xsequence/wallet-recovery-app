import { Box, BoxProps, Image } from '@0xsequence/design-system'

export const ExternalIcon = ({
  src,
  background = 'text80',
  ...rest
}: {
  src: string
  background?: BoxProps['background']
  [key: string]: any
}) => {
  return (
    <Box
      justifyContent="center"
      alignItems="center"
      background={background}
      borderRadius="sm"
      style={{ height: '44px', width: '44px' }}
      {...rest}
    >
      <Image width="10" height="10" src={src} borderRadius="xs" />
    </Box>
  )
}
