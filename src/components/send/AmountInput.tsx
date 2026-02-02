import { Button, Text, TextInput, WarningIcon } from '@0xsequence/design-system'
import { ChangeEvent } from 'react'

export type AmountInputProps = {
  label: string
  value: string
  currentBalance: string
  symbol?: string
  disabled?: boolean
  insufficientBalance?: boolean
  showMaxButton?: boolean
  onChange: (value: string) => void
  onMaxClick?: () => void
}

export function AmountInput({
  label,
  value,
  currentBalance,
  symbol,
  disabled = false,
  insufficientBalance = false,
  showMaxButton = true,
  onChange,
  onMaxClick
}: AmountInputProps) {
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex flex-col gap-0.5'>
        <Text variant="normal" fontWeight="medium" color="text80">
          {label}
        </Text>

        <Text variant="normal" fontWeight="medium" color="text80">
          Current Balance: {currentBalance} {symbol}
        </Text>
      </div>

      <TextInput
        name="amount"
        value={value}
        disabled={disabled}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => {
          onChange(ev.target.value)
        }}
        controls={
          showMaxButton && onMaxClick ? (
            <Button
              size="xs"
              shape="square"
              onClick={onMaxClick}
            >
              Max
            </Button>
          ) : undefined
        }
      />

      {insufficientBalance && (
        <div className='flex flex-row items-center gap-1 pt-1'>
          <WarningIcon color="warning" size="xs" />
          <Text variant="small" color="warning">
            Insufficient balance. Your current balance is {currentBalance} {symbol}
          </Text>
        </div>
      )}
    </div>
  )
}
