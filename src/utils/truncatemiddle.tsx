export function truncateMiddle(str: string, frontChars: number = 6, backChars: number = 4) {
  if (str.length <= frontChars + backChars + 3) {
    // 3 for '...'
    return str
  }
  const start = str.slice(0, frontChars)
  const end = str.slice(-backChars)
  return `${start}...${end}`
}
