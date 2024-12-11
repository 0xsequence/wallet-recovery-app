import { Box, Button } from '@0xsequence/design-system'
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
    <Button
      shape="square"
      borderRadius="sm"
      disabled={disabled}
      onClick={() => {
        if (!disabled) onClick()
      }}
      label={
        <Box justifyContent="center" alignItems="center">
          <Box position="absolute">{icon}</Box>
        </Box>
      }
      style={{ height: '40px', width: '40px', background: 'rgba(255, 255, 255, 0.05)' }}
    />
  )
}
