import { ContractType } from '@0xsequence/indexer'
import type { Payload } from '@0xsequence/wallet-primitives'
import {
  Address,
  encodeFunctionData,
  erc1155Abi,
  erc20Abi,
  erc721Abi,
} from 'viem'
import { TokenRecord } from './types'

export type RecoveryTransactionRequest = Pick<Payload.Call, 'to' | 'value' | 'data'>

/**
 * Creates a transaction request for a coin or collectible token
 * @param token - The token to create a transaction request for
 * @param from - The address of the sender
 * @param to - The address of the recipient
 * @param amount - The amount of the token to send
 * @returns A transaction request or undefined if the token is not supported
 */
export const createTransactionRequest = (
  token: TokenRecord,
  from: Address,
  to: Address,
  amount: bigint
): RecoveryTransactionRequest | undefined => {
  if (token.type === 'COIN') {
    switch (token.contractType) {
      case ContractType.NATIVE: {
        return {
          to,
          value: amount,
          data: '0x',
        }
      }

      case ContractType.ERC20: {
        return {
          to: token.contractAddress as Address,
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [to, amount],
          }),
        }
      }
    }
  } else if (token.type === 'COLLECTIBLE' && token.tokenId) {
    switch (token.contractType) {
      case ContractType.ERC721: {
        return {
          to: token.contractAddress as Address,
          value: 0n,
          data: encodeFunctionData({
            abi: erc721Abi,
            functionName: 'transferFrom',
            args: [from, to, BigInt(token.tokenId)],
          }),
        }
      }

      case ContractType.ERC1155: {
        return {
          to: token.contractAddress as Address,
          value: 0n,
          data: encodeFunctionData({
            abi: erc1155Abi,
            functionName: 'safeTransferFrom',
            args: [from, to, BigInt(token.tokenId), amount, '0x'],
          }),
        }
      }
    }
  }

  return undefined
}
