import { useMemo } from "react"
import { useObservable, useStore } from "~/stores"
import { TokenStore } from "~/stores/TokenStore"
import { CollectibleStore } from "~/stores/CollectibleStore"
import { ParsedCall } from "~/utils/transaction-parser"

interface UseBalanceCheckParams {
  firstCall: ParsedCall
  transactionAmount?: bigint
  chainId: number
}

export function useBalanceCheck({ firstCall, transactionAmount, chainId }: UseBalanceCheckParams) {
  const tokenStore = useStore(TokenStore)
  const collectibleStore = useStore(CollectibleStore)
  const balances = useObservable(tokenStore.balances)
  const collectibles = useObservable(collectibleStore.userCollectibles)

  const hasEnoughBalance = useMemo(() => {
    if (!firstCall) {
      return false
    }
    
    if (firstCall.type === 'erc721') {
      // For ERC721, check if user owns the specific token
      const collectible = collectibles.find(
        c => c.collectibleInfoParams.address.toLowerCase() === firstCall.contractAddress?.toLowerCase() &&
          c.collectibleInfoParams.tokenId === Number(firstCall.tokenId) &&
          c.collectibleInfoParams.chainId === chainId
      )
      return collectible?.collectibleInfoResponse.isOwner ?? false
    } else if (firstCall.type === 'erc1155') {
      // For ERC1155, check if user has enough balance of the specific token ID
      const collectible = collectibles.find(
        c => c.collectibleInfoParams.address.toLowerCase() === firstCall.contractAddress?.toLowerCase() &&
          c.collectibleInfoParams.tokenId === Number(firstCall.tokenId) &&
          c.collectibleInfoParams.chainId === chainId
      )
      const collectibleBalance = collectible?.collectibleInfoResponse.balance ?? 0n
      return collectibleBalance >= (transactionAmount ?? 0n)
    } else {
      // For ERC20 and native tokens, check token balance
      const balanceOfToken = balances.find(balance => balance.contractAddress === firstCall.contractAddress)
      return balanceOfToken ? BigInt(balanceOfToken.balance) >= (transactionAmount ?? 0n) : false
    }
  }, [firstCall, transactionAmount, chainId, balances, collectibles])

  return { hasEnoughBalance, balances, collectibles }
}
