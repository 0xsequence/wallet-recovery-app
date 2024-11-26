import { Box, BoxProps, Image } from '@0xsequence/design-system'

export const ExternalIcon = ({ src, ...rest }: { src: string } & BoxProps) => {
  return (
    <Box
      justifyContent="center"
      alignItems="center"
      borderRadius="sm"
      style={{ height: '44px', width: '44px' }}
      {...rest}
    >
      <Image width="10" height="10" src={src} borderRadius="xs" />
    </Box>
  )
}
