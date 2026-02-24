import { Sequence } from "@0xsequence/wallet-wdk"
import { decodeFunctionData, erc20Abi, erc721Abi, erc1155Abi, Address } from "viem"
import { formatPrettyBalance } from "./format-pretty-balance"

export type ParsedCall = {
  type: 'native' | 'erc20' | 'erc721' | 'erc1155' | 'unknown'
  recipient?: Address
  amount?: bigint
  tokenId?: bigint
  contractAddress?: Address
  decimals?: number
  symbol?: string
  description: string
}

export function parseCall(call: Sequence.TransactionRequest): ParsedCall {
  // Native token transfer (ETH, etc.)
  if (call.value && call.value > 0n && (!call.data || call.data === '0x')) {
    return {
      type: 'native',
      recipient: call.to as Address,
      amount: call.value,
      description: `Transfer ${formatPrettyBalance(call.value.toString(), 18)} native tokens`
    }
  }

  // ERC20 transfer
  if (call.data && call.data.startsWith('0xa9059cbb')) {
    try {
      const decoded = decodeFunctionData({
        abi: erc20Abi,
        data: call.data as `0x${string}`
      })
      if (decoded.functionName === 'transfer') {
        const [to, amount] = decoded.args as [Address, bigint]
        return {
          type: 'erc20',
          recipient: to,
          amount,
          contractAddress: call.to as Address,
          description: `Transfer ERC20 tokens`
        }
      }
    } catch (e) {
      // Decode failed, continue
    }
  }

  // ERC721 transferFrom
  if (call.data && call.data.startsWith('0x23b872dd')) {
    try {
      const decoded = decodeFunctionData({
        abi: erc721Abi,
        data: call.data as `0x${string}`
      })
      if (decoded.functionName === 'transferFrom') {
        const [_from, to, tokenId] = decoded.args as [Address, Address, bigint]
        return {
          type: 'erc721',
          recipient: to,
          tokenId,
          contractAddress: call.to as Address,
          description: `Transfer ERC721 NFT (Token ID: ${tokenId.toString()})`
        }
      }
    } catch (e) {
      // Decode failed, continue
    }
  }

  // ERC1155 safeTransferFrom
  if (call.data && call.data.startsWith('0xf242432a')) {
    try {
      const decoded = decodeFunctionData({
        abi: erc1155Abi,
        data: call.data as `0x${string}`
      })
      if (decoded.functionName === 'safeTransferFrom') {
        const [_from, to, tokenId, amount] = decoded.args.slice(0, 4) as [Address, Address, bigint, bigint]
        return {
          type: 'erc1155',
          recipient: to,
          tokenId,
          amount,
          contractAddress: call.to as Address,
          description: `Transfer ERC1155 NFT (Token ID: ${tokenId.toString()}, Amount: ${amount.toString()})`
        }
      }
    } catch (e) {
      // Decode failed, continue
    }
  }

  return {
    type: 'unknown',
    description: 'Unknown transaction'
  }
}
