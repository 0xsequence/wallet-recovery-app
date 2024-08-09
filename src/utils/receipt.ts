import { ethers } from 'ethers'

export const getTransactionReceipt = async (
  provider: ethers.JsonRpcProvider,
  hash: string,
  maxTries: number = 15
) => {
  let receipt: ethers.TransactionReceipt | null

  let tries = 0

  do {
    if (tries > 5) {
      await new Promise(resolve => setTimeout(resolve, 100 * tries))
    }
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
