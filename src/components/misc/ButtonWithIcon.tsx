import { Button } from '@0xsequence/design-system'
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
      className='rounded-sm'
      disabled={disabled}
      onClick={() => {
        if (!disabled) {onClick()}
      }}
      style={{ height: '40px', width: '40px', background: 'rgba(255, 255, 255, 0.05)' }}
    >
      <div className='flex flex-row justify-center items-center'>
        <div className='absolute'>{icon}</div>
      </div>
    </Button>
  )
}
