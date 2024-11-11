import { TextInput } from '@0xsequence/design-system'
import { ChangeEvent, KeyboardEvent, useState } from 'react'

import passwordEyeOff from '../assets/images/password-eye-off.svg'
import passwordEye from '../assets/images/password-eye.svg'

interface TextInputWrapperProps {
  label: string
  labelLocation?: 'top' | 'left' | 'right' | 'bottom' // Optional prop for label location
  value: string
  onKeyPress: (ev: KeyboardEvent<HTMLInputElement>) => void
  onChange: (ev: ChangeEvent<HTMLInputElement>) => void
  autoFocus?: boolean
}

export const PasswordInput: React.FC<TextInputWrapperProps> = ({
  label,
  labelLocation = 'top',
  value,
  onKeyPress,
  onChange,
  autoFocus = false
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <TextInput
        type={showPassword ? 'text' : 'password'} // Toggle between 'text' and 'password'
        name="password"
        label={label}
        labelLocation={labelLocation}
        value={value}
        onKeyPress={onKeyPress}
        onChange={onChange}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        style={{
          position: 'absolute',
          top: '50%',
          right: '12px',
          transform: 'translateY(5%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {showPassword ? (
          <img src={passwordEyeOff} style={{ width: '25px', height: '25px' }} />
        ) : (
          <img src={passwordEye} style={{ width: '25px', height: '25px' }} />
        )}
      </button>
    </div>
  )
}
