import { useMemo, useEffect, useRef } from "react"
import { useObservable, useStore } from "~/stores"
import { TokenStore } from "~/stores/TokenStore"
import { CollectibleStore } from "~/stores/CollectibleStore"
import { ParsedCall } from "~/utils/transaction-parser"
import { ethers } from "ethers"

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

  const fetchedTokensRef = useRef<Set<string>>(new Set())
  const fetchedCollectiblesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!firstCall) return

    if (firstCall.type === 'erc20' || firstCall.type === 'native') {
      const contractAddress = firstCall.contractAddress || ethers.ZeroAddress
      const tokenKey = `${chainId}-${contractAddress.toLowerCase()}`

      if (fetchedTokensRef.current.has(tokenKey)) {
        return
      }

      fetchedTokensRef.current.add(tokenKey)

      tokenStore.fetchTokenBalanceIfMissing(chainId, contractAddress)
    } else if (firstCall.type === 'erc721' || firstCall.type === 'erc1155') {
      // Fetch collectible info for ERC721 and ERC1155 tokens
      const contractAddress = firstCall.contractAddress
      const tokenId = firstCall.tokenId

      if (!contractAddress || tokenId === undefined) {
        return
      }

      const collectibleKey = `${chainId}-${contractAddress.toLowerCase()}-${tokenId}`

      if (fetchedCollectiblesRef.current.has(collectibleKey)) {
        return
      }

      fetchedCollectiblesRef.current.add(collectibleKey)

      // Check if collectible is already in the store
      const existingCollectible = collectibleStore.userCollectibles.get().find(
        c => c.collectibleInfoParams.address.toLowerCase() === contractAddress.toLowerCase() &&
          c.collectibleInfoParams.tokenId === Number(tokenId) &&
          c.collectibleInfoParams.chainId === chainId
      )

      if (!existingCollectible) {
        // Fetch collectible info if not in store
        const contractType = firstCall.type === 'erc721' ? 'ERC721' : 'ERC1155'
        collectibleStore.getCollectibleInfo({
          chainId,
          address: contractAddress,
          tokenId: Number(tokenId),
          contractType
        }).then(response => {
          // Update the userCollectibles observable with the fetched data
          const currentCollectibles = collectibleStore.userCollectibles.get()
          collectibleStore.userCollectibles.set([
            ...currentCollectibles,
            {
              collectibleInfoParams: {
                chainId,
                address: contractAddress,
                tokenId: Number(tokenId),
                contractType
              },
              collectibleInfoResponse: response
            }
          ])
        }).catch(error => {
          console.error('Error fetching collectible info:', error)
        })
      }
    }
  }, [firstCall, chainId, tokenStore, collectibleStore])

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
      const contractAddress = firstCall.contractAddress || ethers.ZeroAddress
      const balanceOfToken = balances.find(
        balance => balance.contractAddress.toLowerCase() === contractAddress.toLowerCase() &&
          balance.chainId === chainId
      )
      return balanceOfToken ? BigInt(balanceOfToken.balance) >= (transactionAmount ?? 0n) : false
    }
  }, [firstCall, transactionAmount, chainId, balances, collectibles])

  return { hasEnoughBalance, balances, collectibles }
}
