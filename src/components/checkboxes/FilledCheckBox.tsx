import { Box } from '@0xsequence/design-system'

import Checkmark from '~/assets/icons/checkmark.svg'
import EmptyCheckBox from '~/assets/icons/square-checkbox.svg'

export default function FilledCheckBox({ checked }: { checked: boolean }) {
  return (
    <Box
      width="7"
      height="7"
      justifyContent="center"
      alignItems="center"
      style={{ borderRadius: '6px', background: checked ? '#4F4F4F' : 'inherit' }}
    >
      {checked ? (
        <img src={Checkmark} alt="Checkmark" style={{ width: '16px', height: '16px' }} />
      ) : (
        <img src={EmptyCheckBox} alt="Empty Checkbox" style={{ width: '28px', height: '28px' }} />
      )}
    </Box>
  )
}
