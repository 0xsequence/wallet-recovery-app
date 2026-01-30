import { Box, Text, TextInput } from '@0xsequence/design-system'
import { ChangeEvent } from 'react'

export type AddressInputProps = {
  label: string
  value: string
  disabled?: boolean
  placeholder?: string
  helperText?: string
  onChange: (value: string) => void
}

export function AddressInput({
  label,
  value,
  disabled = false,
  placeholder = '0x...',
  helperText,
  onChange
}: AddressInputProps) {
  return (
    <Box flexDirection="column" gap="1">
      <Text variant="normal" fontWeight="medium" color="text80">
        {label}
      </Text>

      <TextInput
        name="to"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => {
          onChange(ev.target.value)
        }}
      />
      
      {helperText && (
        <Text variant="small" color="text50">
          {helperText}
        </Text>
      )}
    </Box>
  )
}
