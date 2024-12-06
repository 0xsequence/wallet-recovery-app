import { Box } from '@0xsequence/design-system'

import CheckmarkBlack from '~/assets/icons/checkmark-black.svg'
import EmptyRoundCheckBox from '~/assets/icons/round-checkbox.svg'

export const ROUND_CHECKBOX_SIZE = 8

export function FilledRoundCheckBox({ checked }: { checked: boolean }) {
  return (
    <Box
      width={`${ROUND_CHECKBOX_SIZE}`}
      height={`${ROUND_CHECKBOX_SIZE}`}
      justifyContent="center"
      alignItems="center"
      background={checked ? 'white' : 'transparent'}
      borderRadius="circle"
    >
      {checked ? (
        <img src={CheckmarkBlack} alt="Checkmark" style={{ width: '24px', height: '24px' }} />
      ) : (
        <img
          src={EmptyRoundCheckBox}
          alt="Empty Round Checkbox"
          style={{ width: `${ROUND_CHECKBOX_SIZE * 4}px`, height: `${ROUND_CHECKBOX_SIZE * 4}px` }}
        />
      )}
    </Box>
  )
}
