import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { ERC20_ABI } from '~/constants/abi'
import { useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'
import { getIndexedDB } from '~/utils/indexeddb'
import { IndexedDBKey } from '~/constants/storage'

type useFetchTokenMetadataProps = {
       parsedCalls: any[]
       chainId: number
}

type TokenMetadata = {
       decimals: number
       symbol: string
}

export function useFetchTokenMetadata({ parsedCalls, chainId,  }: useFetchTokenMetadataProps) {
       const networkStore = useStore(NetworkStore)
       const [tokenMetadata, setTokenMetadata] = useState<Map<string, TokenMetadata>>(new Map())

       useEffect(() => {
              const fetchTokenMetadata = async () => {
                     const provider = networkStore.providerForChainId(chainId)
                     const metadata = new Map<string, TokenMetadata>()

                     const db = await getIndexedDB(IndexedDBKey.TOKEN_METADATA)

                     for (const call of parsedCalls) {
                            if (call.type === 'erc20' && call.contractAddress && !tokenMetadata.has(call.contractAddress)) {
                                   const cacheKey = `${chainId}:${call.contractAddress.toLowerCase()}`
                                   
                                   try {
                                          // Try to get from IndexedDB first
                                          const cachedMetadata = await db.get(IndexedDBKey.TOKEN_METADATA, cacheKey)
                                          
                                          if (cachedMetadata) {
                                                 metadata.set(call.contractAddress, cachedMetadata)
                                          } else {
                                                 // Fetch from blockchain if not in cache
                                                 const erc20 = new ethers.Contract(call.contractAddress, ERC20_ABI, provider)
                                                 const [decimals, symbol] = await Promise.all([
                                                        erc20.decimals(),
                                                        erc20.symbol(),
                                                 ])
                                                 const fetchedMetadata = {
                                                        decimals: Number(decimals),
                                                        symbol: symbol
                                                 }
                                                 metadata.set(call.contractAddress, fetchedMetadata)
                                                 
                                                 // Store in IndexedDB for future use
                                                 await db.put(IndexedDBKey.TOKEN_METADATA, fetchedMetadata, cacheKey)
                                          }
                                   } catch (error) {
                                          console.error(`Failed to fetch metadata for ${call.contractAddress}:`, error)
                                          const fallbackMetadata = {
                                                 decimals: 18,
                                                 symbol: 'tokens'
                                          }
                                          metadata.set(call.contractAddress, fallbackMetadata)
                                   }
                            }
                     }

                     if (metadata.size > 0) {
                            setTokenMetadata(metadata)
                     }

                     db.close()
              }

              fetchTokenMetadata()
       }, [parsedCalls, chainId, networkStore])

       return tokenMetadata
}
