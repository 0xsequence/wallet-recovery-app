

import CheckmarkBlack from '~/assets/icons/checkmark-black.svg'
import EmptyRoundCheckBox from '~/assets/icons/round-checkbox.svg'

export const ROUND_CHECKBOX_SIZE = 8

export function FilledRoundCheckBox({ checked, ...rest }: { checked: boolean }) {
  return (
    <div
      className='flex flex-row justify-center items-center'
      style={{ width: `${ROUND_CHECKBOX_SIZE}px`, height: `${ROUND_CHECKBOX_SIZE}px`, background: checked ? 'white' : 'transparent', borderRadius: 'circle' }}
      {...rest}
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
    </div>
  )
}
