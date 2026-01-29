import { useMemo, useEffect, useState } from "react"
import { useObservable, useStore } from "~/stores"
import { TokenStore } from "~/stores/TokenStore"
import { CollectibleStore } from "~/stores/CollectibleStore"
import { ParsedCall } from "~/utils/transaction-parser"
import { ContractType } from "@0xsequence/indexer"

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
  const [isFetchingMissing, setIsFetchingMissing] = useState(false)

  // Proactively fetch missing balances when payload is loaded
  useEffect(() => {
    if (!firstCall || isFetchingMissing) {
      return
    }

    const fetchMissingBalance = async () => {
      setIsFetchingMissing(true)

      try {
        if (firstCall.type === 'erc721' || firstCall.type === 'erc1155') {
          // Check if collectible info is missing
          const collectible = collectibles.find(
            c => c.collectibleInfoParams.address.toLowerCase() === firstCall.contractAddress?.toLowerCase() &&
              c.collectibleInfoParams.tokenId === Number(firstCall.tokenId) &&
              c.collectibleInfoParams.chainId === chainId
          )

          if (!collectible && firstCall.contractAddress && firstCall.tokenId !== undefined) {
            await collectibleStore.fetchCollectibleInfoIfMissing({
              chainId,
              address: firstCall.contractAddress,
              tokenId: Number(firstCall.tokenId),
              contractType: firstCall.type === 'erc721' ? ContractType.ERC721 : ContractType.ERC1155
            })
          }
        } else if (firstCall.type === 'erc20' || firstCall.type === 'native') {
          // Check if token balance is missing
          const contractAddress = firstCall.contractAddress || '0x0000000000000000000000000000000000000000'
          const balanceOfToken = balances.find(
            balance => balance.contractAddress.toLowerCase() === contractAddress.toLowerCase() &&
              balance.chainId === chainId
          )

          if (!balanceOfToken) {
            await tokenStore.fetchTokenBalanceIfMissing(chainId, contractAddress)
          }
        }
      } catch (error) {
        console.error('Error fetching missing balance:', error)
      } finally {
        setIsFetchingMissing(false)
      }
    }

    fetchMissingBalance()
  }, [firstCall, chainId, tokenStore, collectibleStore, balances, collectibles, isFetchingMissing])

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
      const contractAddress = firstCall.contractAddress || '0x0000000000000000000000000000000000000000'
      const balanceOfToken = balances.find(
        balance => balance.contractAddress.toLowerCase() === contractAddress.toLowerCase() &&
          balance.chainId === chainId
      )
      return balanceOfToken ? BigInt(balanceOfToken.balance) >= (transactionAmount ?? 0n) : false
    }
  }, [firstCall, transactionAmount, chainId, balances, collectibles])

  return { hasEnoughBalance, balances, collectibles }
}
