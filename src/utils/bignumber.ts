export const truncateNumber = (value: number, decimals: number) => {
  return Math.floor(value * 10 ** decimals) / 10 ** decimals
}
