import { ethers } from 'ethers'

export const getTransactionReceipt = async (
  provider: ethers.providers.JsonRpcProvider,
  hash: string,
  maxTries: number = 15
) => {
  let receipt: ethers.providers.TransactionReceipt | undefined

  let tries = 0

  do {
    receipt = await provider.getTransactionReceipt(hash as string)

    if (tries === maxTries) {
      console.warn(`Could not get receipt for transaction ${hash} after ${tries} tries`)
      return undefined
    }
    if (receipt) {
      return receipt
    }
    tries++
  } while (!receipt && tries <= maxTries)
}
