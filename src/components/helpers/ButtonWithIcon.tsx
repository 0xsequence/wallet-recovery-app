import { Box } from '@0xsequence/design-system'
import React from 'react'

export const ButtonWithIcon = ({
  icon,
  onClick,
  disabled = false
}: {
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) => {
  return (
    <Box
      justifyContent="center"
      alignItems="center"
      background="backgroundMuted"
      opacity={disabled ? '50' : '100'}
      borderRadius="sm"
      height="9"
      width="9"
      cursor={disabled ? 'default' : 'pointer'}
      onClick={() => {
        if (!disabled) onClick()
      }}
    >
      {icon}
    </Box>
  )
}
