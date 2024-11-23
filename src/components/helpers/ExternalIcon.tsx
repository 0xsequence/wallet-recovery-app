import { Box, Image } from '@0xsequence/design-system'

export const ExternalIcon = ({ src }: { src: string }) => {
  return (
    <Box
      justifyContent="center"
      alignItems="center"
      background="text80"
      borderRadius="sm"
      style={{ height: '44px', width: '44px' }}
    >
      <Image width="9" height="9" src={src} />
    </Box>
  )
}
