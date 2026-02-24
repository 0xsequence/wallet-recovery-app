export const limitDecimals = (value: string, decimals: number = 4) => {
    const [integerPart, fractionalPart = ''] = value.split('.')
  
    const truncatedFractionalPart = fractionalPart.slice(0, decimals)
  
    // If the truncated fractional part is empty, return the integer part
    if (truncatedFractionalPart.length === 0) {
      return integerPart
    }
  
    // Check if the truncated fractional part is all zeros
    if (truncatedFractionalPart.split('').every(char => char === '0')) {
      return integerPart
    }
  
    return `${integerPart}.${truncatedFractionalPart}`
  }
  