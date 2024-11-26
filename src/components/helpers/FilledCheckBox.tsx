import { Box } from '@0xsequence/design-system'

import Checkmark from '~/assets/icons/checkmark.svg'
import EmptyCheckBox from '~/assets/icons/square-checkbox.svg'

export default function FilledCheckBox({ checked, size = 'lg' }: { checked: boolean; size?: 'lg' | 'md' }) {
  return (
    <Box
      width={size === 'lg' ? '7' : '5'}
      height={size === 'lg' ? '7' : '5'}
      justifyContent="center"
      alignItems="center"
      style={{ borderRadius: size === 'lg' ? '6px' : '3px', background: checked ? '#4F4F4F' : 'inherit' }}
    >
      {checked ? (
        <img
          src={Checkmark}
          alt="Checkmark"
          style={{ width: size === 'lg' ? '16px' : '12px', height: size === 'lg' ? '16px' : '12px' }}
        />
      ) : (
        <img
          src={EmptyCheckBox}
          alt="Empty Checkbox"
          style={{ width: size === 'lg' ? '28px' : '20px', height: size === 'lg' ? '28px' : '20px' }}
        />
      )}
    </Box>
  )
}
