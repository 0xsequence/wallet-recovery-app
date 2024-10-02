import { commons } from '@0xsequence/core'
import { Box, Button, Card, Divider, Text } from '@0xsequence/design-system'
import { ConnectOptions } from '@0xsequence/provider'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

import { useStore } from '~/stores'
import { CollectibleStore } from '~/stores/CollectibleStore'
import { CollectibleContractType } from '~/stores/CollectibleStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { TokenStore } from '~/stores/TokenStore'
import { WalletStore } from '~/stores/WalletStore'

import NetworkTag from '../NetworkTag'

export default function SignClientTransactionRequest({
  onClose
}: {
  onClose: (details?: {
    txn: commons.transaction.Transactionish
    chainId: number
    options?: ConnectOptions
  }) => void
}) {
  const walletStore = useStore(WalletStore)
  const networkStore = useStore(NetworkStore)
  const tokenStore = useStore(TokenStore)
  const collectibleStore = useStore(CollectibleStore)

  const [contractType, setContractType] = useState<string | null>(null)
  const [tokenId, setTokenId] = useState<number | null>(null)

  const details = walletStore.toSignTxnDetails.get()

  useEffect(() => {
    if (!details) return
    const network = networkStore.networkForChainId(details.chainId ?? 0)
    const provider = new ethers.JsonRpcProvider(network?.rpcUrl)
    detectTokenType(details.txn[0].to, provider, details.txn[0].data)
  }, [details])

  useEffect(() => {
    if (tokenId) {
      const collectibleInfo = {
        chainId: details.chainId,
        address: details.txn[0].to,
        tokenId: tokenId,
        contractType: contractType as CollectibleContractType
      }
      collectibleStore.getCollectibleInfo(collectibleInfo)
    } else {
      const tokenInfo = tokenStore.getTokenInfo(details.chainId, details.txn[0].to)
      console.log(tokenInfo)
    }
  }, [contractType, tokenId])

  async function detectTokenType(
    contractAddress: string,
    provider: ethers.JsonRpcProvider,
    transactionData: string // Add transaction data
  ) {
    // Define ABIs for ERC-20, ERC-721, ERC-1155, and EIP-165
    const erc20Abi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)'
    ]

    const erc721Abi = [
      'function ownerOf(uint256 tokenId) view returns (address)',
      'function balanceOf(address owner) view returns (uint256)',
      'function transferFrom(address from, address to, uint256 tokenId)', // Add transfer function to decode tokenId
      'function safeTransferFrom(address from, address to, uint256 tokenId)'
    ]

    const erc1155Abi = [
      'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
      'function uri(uint256 id) view returns (string)',
      'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)' // For ERC-1155 tokenId
    ]

    const eip165Abi = ['function supportsInterface(bytes4 interfaceID) external view returns (bool)']

    // Default the tokenId to null initially
    setTokenId(null)

    try {
      // Check if it's ERC-20 by trying its specific methods
      const erc20Contract = new ethers.Contract(contractAddress, erc20Abi, provider)
      await erc20Contract.name() // If this works, it's an ERC-20 token
      setContractType('ERC20')
      return // Return early since we found the contract is ERC-20
    } catch (err) {
      // Not ERC-20, continue checking for other types
    }

    try {
      // Check if it supports ERC-721 or ERC-1155 using EIP-165
      const eip165Contract = new ethers.Contract(contractAddress, eip165Abi, provider)

      const isErc721 = await eip165Contract.supportsInterface('0x80ac58cd') // ERC-721 interface ID
      if (isErc721) {
        setContractType('ERC721')

        // Decode the transaction data for ERC-721 to extract tokenId
        const erc721Interface = new ethers.Interface(erc721Abi)
        try {
          const decodedData = erc721Interface.decodeFunctionData('transferFrom', transactionData)
          const tokenId = decodedData.tokenId.toString() // Extract tokenId from decoded data
          setTokenId(tokenId)
        } catch (decodeErr) {
          console.error('Failed to decode ERC-721 transaction data', decodeErr)
        }

        return // Return early since we found the contract is ERC-721
      }

      const isErc1155 = await eip165Contract.supportsInterface('0xd9b67a26') // ERC-1155 interface ID
      if (isErc1155) {
        setContractType('ERC1155')

        // Decode the transaction data for ERC-1155 to extract tokenId
        const erc1155Interface = new ethers.Interface(erc1155Abi)
        try {
          const decodedData = erc1155Interface.decodeFunctionData('safeTransferFrom', transactionData)
          const tokenId = decodedData.id.toString() // Extract tokenId from decoded data
          setTokenId(tokenId)
        } catch (decodeErr) {
          console.error('Failed to decode ERC-1155 transaction data', decodeErr)
        }

        return // Return early since we found the contract is ERC-1155
      }
    } catch (err) {
      // Not EIP-165 or doesn't support ERC-721/ERC-1155
    }

    // If no match, set contract type to null
    setContractType(null)
    setTokenId(null) // No tokenId found
  }

  return (
    <Box>
      <Box flexDirection="column" padding="10" alignItems="center">
        <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
          {'Would you like to approve this transaction?'}
        </Text>
        <Divider color="gradientPrimary" width="full" height="px" />
        <Text variant="md" color="text100" paddingY="3" paddingBottom="1">
          <Box flexDirection="column" alignItems="center">
            <Text variant="small" color="text100" marginBottom="2">
              {details.options.origin}
            </Text>
            <Card flexDirection="row" alignItems="center" gap="1">
              <Text variant="small" color="text100">
                {`Sending`}
              </Text>
              {details.txn[0].value ? (
                <Text
                  variant="small"
                  color="text100"
                >{`${ethers.formatUnits(details.txn[0].value)} native tokens on`}</Text>
              ) : (
                <Text
                  variant="small"
                  color="text100"
                >{`non-native tokens with contract address of ${details.txn[0].to} on`}</Text>
              )}
              <NetworkTag chainId={details.chainId} paddingTop="0" paddingBottom="1" />
            </Card>
          </Box>
        </Text>
        <Box flexDirection={{ sm: 'column', md: 'row' }} gap="2" width="full" marginTop="10">
          <Button
            width="full"
            label={`Cancel`}
            onClick={() => {
              onClose()
            }}
            data-id="signingCancel"
          />

          <Button
            width="full"
            variant="primary"
            label={'Send'}
            onClick={() => {
              onClose(details)
            }}
            data-id="signingContinue"
          />
        </Box>
      </Box>
    </Box>
  )
}
