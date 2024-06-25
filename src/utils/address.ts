import { ethers } from 'ethers'

export const isAddress = (address: string): boolean => {
  try {
    ethers.utils.getAddress(address)
  } catch (error) {
    return false
  }

  // Enforce address starts with 0x
  return address.startsWith('0x')
}

export const isNativeTokenAddress = (address: string) => {
  return address === '0x0' || compareAddress(address, ethers.constants.AddressZero)
}

export const normalizeAddress = ethers.utils.getAddress

export const compareAddress = (a: string | undefined, b: string | undefined): boolean => {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase()
}

export const truncateAddress = (address: string, minPrefix: number = 20, minSuffix: number = 3): string => {
  address = normalizeAddress(address)
  if (minPrefix + minSuffix >= 40) {
    return address
  } else {
    return `${address.substring(0, 2 + minPrefix)}…${address.substring(address.length - minSuffix)}`
  }
}

export const getAddressId = (chainId: number, contractAddress: string, tokenId?: string): string => {
  return `${chainId}/${normalizeAddress(contractAddress)}` + (tokenId ? `/${tokenId}` : '')
}
