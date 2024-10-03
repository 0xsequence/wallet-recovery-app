import { commons } from '@0xsequence/core'
import {
  Box,
  Button,
  Card,
  Collapsible,
  Divider,
  ExternalLinkIcon,
  IconButton,
  Text
} from '@0xsequence/design-system'
import { ConnectOptions } from '@0xsequence/provider'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

import { getNetworkTitle } from '~/utils/network'

import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from '~/constants/abi.ts'

import { useStore } from '~/stores'
import { CollectibleStore } from '~/stores/CollectibleStore'
import { CollectibleContractType } from '~/stores/CollectibleStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { WalletStore } from '~/stores/WalletStore'

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
  const collectibleStore = useStore(CollectibleStore)

  const [contractType, setContractType] = useState<'native' | 'erc20' | 'erc721' | 'erc1155'>('native')
  const [tokenId, setTokenId] = useState<number | null>(null)
  const [transactionInfo, setTransactionInfo] = useState<{
    name: string | null
  }>({
    name: null
  })
  const [amount, setAmount] = useState<number | null>(null)
  const [timestamp, setTimestamp] = useState<string>('')

  const details = walletStore.toSignTxnDetails.get()

  useEffect(() => {
    // TODO maybe set timestamp state in store or other persistent state
    setTimestamp(new Date().toLocaleString())
    if (!details) return
    console.log('details', details)
    const network = networkStore.networkForChainId(details.chainId ?? 0)
    const provider = new ethers.JsonRpcProvider(network?.rpcUrl)
    parseTransaction(details.txn[0].data, details.txn[0].to, provider)
  }, [details])

  // useEffect(() => {
  //   if (!details) return
  //   const collectibleInfo = {
  //     chainId: details.chainId,
  //     address: details.txn[0].to,
  //     tokenId: tokenId,
  //     contractType: contractType as CollectibleContractType
  //   }
  //   collectibleStore.getCollectibleInfo(collectibleInfo)
  // }, [details, contractType, tokenId])

  // Define the main function that parses transaction data
  async function parseTransaction(
    transactionData: string,
    contractAddress: string,
    provider: ethers.JsonRpcProvider
  ) {
    const eip165Abi = ['function supportsInterface(bytes4 interfaceID) external view returns (bool)']

    try {
      // 1. Check if ERC-20
      const erc20Contract = new ethers.Contract(contractAddress, ERC20_ABI, provider)
      try {
        const tokenName = await erc20Contract.symbol()
        setContractType('erc20')
        setTransactionInfo({
          name: tokenName
        })
        const erc20Interface = new ethers.Interface(ERC20_ABI)
        const decodedData = erc20Interface.parseTransaction({ data: transactionData })
        const decimals = await erc20Contract.decimals()
        setAmount(Number(ethers.formatUnits(decodedData?.args[1], decimals ?? 18)))

        return
      } catch (err) {
        // If it fails, it means it's not an ERC-20 token, continue checking
      }

      const eip165Contract = new ethers.Contract(contractAddress, eip165Abi, provider)

      // 2. Check if ERC-721
      const isErc721 = await eip165Contract.supportsInterface('0x80ac58cd') // ERC-721 interface ID
      if (isErc721) {
        setContractType('erc721')

        const erc721Contract = new ethers.Contract(contractAddress, ERC721_ABI, provider)
        const decodedData = erc721Contract.interface.decodeFunctionData('safeTransferFrom', transactionData)
        const tokenId = decodedData.tokenId.toString()

        setTokenId(tokenId)

        const tokenName = await erc721Contract.name()
        setTransactionInfo({
          name: tokenName
        })
        return
      }

      // 3. Check if ERC-1155
      const isErc1155 = await eip165Contract.supportsInterface('0xd9b67a26') // ERC-1155 interface ID
      if (isErc1155) {
        setContractType('erc1155')

        const erc1155Contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider)
        const decodedData = erc1155Contract.interface.decodeFunctionData('safeTransferFrom', transactionData)
        const tokenId = decodedData.id.toString()

        setTokenId(tokenId)

        const tokenUri = await erc1155Contract.uri(tokenId)
        setTransactionInfo({
          name: tokenUri // For ERC-1155, you may have to use the URI instead of a name
        })
        return
      }
    } catch (err) {
      console.error('Error parsing contract type:', err)
    }

    // 4. If none of the above, it's a native transaction (ETH or MATIC)
    setContractType('native')
    setTransactionInfo({
      name: `${getNetworkTitle(details?.chainId ?? 1)} Native Token`
    })
  }

  return (
    <Box>
      {details && (
        <Box>
          <Box flexDirection="column" padding="10" gap="4">
            <Text alignSelf="center" variant="md" fontWeight="bold" color="text100">
              {'Would you like to approve this transaction?'}
            </Text>
            <Divider color="gradientPrimary" width="full" height="px" />
            <Card flexDirection="row" justifyContent="space-between">
              <Text variant="md" color="text100">
                {`Requested at`}
              </Text>
              <Text variant="md" color="text100">
                {timestamp}
              </Text>
            </Card>
            <Card flexDirection="row" justifyContent="space-between">
              <Text variant="md" color="text100">
                {`Origin`}
              </Text>
              <Box flexDirection="row" alignItems="center" gap="3">
                <Text variant="md" color="text100">
                  {details?.options?.origin?.split('//')[1]}
                </Text>
                <IconButton
                  size="xs"
                  icon={ExternalLinkIcon}
                  onClick={() => window.open(details.options?.origin, '_blank')}
                />
              </Box>
            </Card>
            <Card flexDirection="row" justifyContent="space-between">
              <Text variant="md" color="text100">
                {`${transactionInfo.name}`}
              </Text>
              <Text variant="md" color="text100">
                {`${amount ?? 0} ${transactionInfo.name}`}
              </Text>
            </Card>
            <Collapsible label={`Transaction Data`}>
              <Box flexDirection="column" gap="2">
                {details.txn.map((txn: commons.transaction.Transactionish, idx: number) => (
                  <Card key={idx}>
                    <Text variant="code" color="text80" style={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(txn, null, 4) || `Native token transfer`}
                    </Text>
                  </Card>
                ))}
              </Box>
            </Collapsible>
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
      )}
    </Box>
  )
}
