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

import { ERC20_ABI, ERC165_ABI, ERC721_ABI, ERC1155_ABI } from '~/constants/abi.ts'

import { useStore } from '~/stores'
import { CollectibleStore } from '~/stores/CollectibleStore'
import { CollectibleContractType } from '~/stores/CollectibleStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { WalletStore } from '~/stores/WalletStore'

export default function SignClientTransactionRequest({
  onClose
}: {
  onClose: (details?: {
    txn: ethers.Transaction[] | ethers.TransactionRequest[]
    chainId: number
    options?: ConnectOptions
  }) => void
}) {
  const walletStore = useStore(WalletStore)
  const networkStore = useStore(NetworkStore)
  const collectibleStore = useStore(CollectibleStore)

  const [contractType, setContractType] = useState<
    'Unknown' | 'Native Token' | 'ERC20' | 'ERC721' | 'ERC1155'
  >('Unknown')
  const [tokenId, setTokenId] = useState<number | null>(null)
  // Keep as transactionInfo for now since we may want to add more info in the future
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
    // TODO check if we need to account for multiple transactions in one request
    if (!details) return

    setTimestamp(new Date().toLocaleString())

    const network = networkStore.networkForChainId(details.chainId ?? 0)
    const provider = new ethers.JsonRpcProvider(network?.rpcUrl)

    const data = details.txn[0].data as string
    const to = details.txn[0].to as string

    parseTransaction(data, to, provider)
  }, [details])

  useEffect(() => {
    if (!details || !details?.txn[0].to || !tokenId) return

    const to = details.txn[0].to as string

    const collectibleInfo = {
      chainId: details.chainId,
      address: to,
      tokenId: tokenId,
      contractType: contractType as CollectibleContractType
    }
    collectibleStore.getCollectibleInfo(collectibleInfo)
  }, [contractType, tokenId])

  // Define the main function that parses transaction data
  async function parseTransaction(
    transactionData: string,
    contractAddress: string,
    provider: ethers.JsonRpcProvider
  ) {
    try {
      // 1. Check if ERC-20
      const erc20Contract = new ethers.Contract(contractAddress, ERC20_ABI, provider)
      try {
        const tokenName = await erc20Contract.symbol()
        setContractType('ERC20')
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

      const erc165Contract = new ethers.Contract(contractAddress, ERC165_ABI, provider)

      // 2. Check if ERC-721
      const isErc721 = await erc165Contract.supportsInterface('0x80ac58cd') // ERC-721 interface ID
      if (isErc721) {
        setContractType('ERC721')

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
      const isErc1155 = await erc165Contract.supportsInterface('0xd9b67a26') // ERC-1155 interface ID
      if (isErc1155) {
        setContractType('ERC1155')

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
      console.error(
        'Error parsing contract type. The transaction is either using a smart contract that doesnt support ERC165 or the token is native:',
        err
      )
    }

    // 4. If value field is non-zero, then it's a native token transfer
    if (!!details?.txn[0].value) {
      setContractType('Native Token')
      setTransactionInfo({
        name: `${getNetworkTitle(details?.chainId ?? 1)} Native Token`
      })
      return
    }

    // 5. If we reach here, its a token we couldn't decode the contract type
    console.info('Token info could not be decoded for this transaction')
  }

  return (
    <Box>
      {details && (
        <Box>
          <Box flexDirection="column" padding="10" gap="4">
            <Text alignSelf="center" variant="md" fontWeight="bold" color="text100">
              Would you like to approve this transaction?
            </Text>
            <Divider color="gradientPrimary" width="full" height="px" />
            <Card flexDirection="row" justifyContent="space-between">
              <Text variant="md" color="text100">
                Requested at
              </Text>
              <Text variant="md" color="text100">
                {timestamp}
              </Text>
            </Card>
            <Card flexDirection="row" justifyContent="space-between" alignItems="center">
              <Text variant="md" color="text100">
                Origin
              </Text>
              <Box alignItems="center" gap="3">
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
                Token Standard
              </Text>
              <Text variant="md" color="text100">
                {`${contractType}`}
              </Text>
            </Card>
            {contractType === 'ERC721' ||
              (contractType === 'ERC1155' && (
                <Card flexDirection="row" justifyContent="space-between">
                  <Text variant="md" color="text100">
                    Token ID
                  </Text>
                  <Text variant="md" color="text100">
                    {`${tokenId}`}
                  </Text>
                </Card>
              ))}
            <Card flexDirection="row" justifyContent="space-between">
              <Text variant="md" color="text100">
                Amount
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
