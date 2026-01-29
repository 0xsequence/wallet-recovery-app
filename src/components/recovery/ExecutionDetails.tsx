import { Box, Text, Image, Card, Divider, Tooltip, truncateAddress } from "@0xsequence/design-system"
import SendIcon from '~/assets/icons/send.svg'
import CoinIcon from '~/assets/icons/coin.svg'
import CollectionIcon from '~/assets/icons/collection.svg'
import { ethers } from 'ethers'
import { Address } from "viem"

type ParsedCall = {
       type: 'native' | 'erc20' | 'erc721' | 'erc1155' | 'unknown'
       recipient?: Address
       amount?: bigint
       tokenId?: bigint
       contractAddress?: Address
       decimals?: number
       symbol?: string
       description: string
}

type ExecutionDetailsProps = {
       parsedCalls: ParsedCall[]
       tokenMetadata: Map<string, { decimals: number; symbol: string }>
}


function ExecutionDetails({ parsedCalls, tokenMetadata }: ExecutionDetailsProps) {
       const getTransferIcon = (type: string) => {
              if (type === 'native' || type === 'erc20') {
                     return CoinIcon
              }
              if (type === 'erc721' || type === 'erc1155') {
                     return CollectionIcon
              }
              return null
       }

       const getTransferTypeLabel = (parsedCall: ParsedCall) => {
              switch (parsedCall.type) {
                     case 'native':
                            return 'Native Transfer'
                     case 'erc20': {
                            const symbol = tokenMetadata.get(parsedCall.contractAddress!)?.symbol
                            return symbol ? `${symbol} Transfer` : 'ERC20 Transfer'
                     }
                     case 'erc721':
                            return 'ERC721 NFT'
                     case 'erc1155':
                            return 'ERC1155 NFT'
                     default:
                            return 'Transfer'
              }
       }

       return (
              <Box flexDirection="column" gap="1.5" marginTop="2">
                     <Box flexDirection="row" gap="1" alignItems="center">
                            <Image src={SendIcon} style={{ width: '16px', height: '16px' }} />
                            <Text variant="small" fontWeight="bold" color="text80">
                                   Transfers ({parsedCalls.length})
                            </Text>
                     </Box>
                     {parsedCalls.map((parsedCall, idx) => (
                            <Card
                                   key={idx}
                                   flexDirection="column"
                                   gap="1"
                                   padding="2"
                                   background="backgroundMuted"
                                   borderRadius="sm"
                                   style={{
                                          border: '1px solid rgba(255, 255, 255, 0.1)'
                                   }}
                            >
                                   <Box flexDirection="row" gap="2" alignItems="center">
                                          {getTransferIcon(parsedCall.type) && (
                                                 <Box
                                                        padding="1.5"
                                                        background="backgroundSecondary"
                                                        borderRadius="sm"
                                                        style={{
                                                               display: 'flex',
                                                               alignItems: 'center',
                                                               justifyContent: 'center'
                                                        }}
                                                 >
                                                        <Image src={getTransferIcon(parsedCall.type)!} style={{ width: '20px', height: '20px' }} />
                                                 </Box>
                                          )}
                                          <Box flexDirection="column" gap="0.25" style={{ flex: 1 }}>
                                                 <Text variant="small" fontWeight="bold" color="text100">
                                                        {getTransferTypeLabel(parsedCall)}
                                                 </Text>
                                                 <Text variant="xsmall" color="text50">
                                                        {parsedCall.description}
                                                 </Text>
                                          </Box>
                                   </Box>

                                   <Divider marginY={"1"} />

                                   <Box flexDirection="column" gap="1">
                                          {parsedCall.recipient && (
                                                 <Box flexDirection="row" gap="2" alignItems="center">
                                                        <Box style={{ minWidth: '80px' }}>
                                                               <Text variant="xsmall" fontWeight="medium" color="text50">
                                                                      Recipient:
                                                               </Text>
                                                        </Box>
                                                        <Tooltip message={parsedCall.recipient}>
                                                               <Text
                                                                      variant="xsmall"
                                                                      style={{
                                                                             fontFamily: 'monospace',
                                                                             backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                                             padding: '4px 8px',
                                                                             borderRadius: '4px',
                                                                             cursor: 'pointer'
                                                                      }}
                                                                      color="text80"
                                                               >
                                                                      {truncateAddress(parsedCall.recipient, 6, 4)}
                                                               </Text>
                                                        </Tooltip>
                                                 </Box>
                                          )}

                                          {(parsedCall.type === 'native' || parsedCall.type === 'erc20') && parsedCall.amount !== undefined && (() => {
                                                 const decimals = parsedCall.type === 'native' ? 18 : tokenMetadata.get(parsedCall.contractAddress!)?.decimals ?? 18
                                                 const symbol = parsedCall.type === 'native' ? 'ETH' : tokenMetadata.get(parsedCall.contractAddress!)?.symbol ?? 'tokens'

                                                 const amountStr = parsedCall.amount.toString()
                                                 const formattedAmount = ethers.formatUnits(amountStr, decimals)

                                                 return (
                                                        <Box flexDirection="row" gap="2" alignItems="center">
                                                               <Box style={{ minWidth: '80px' }}>
                                                                      <Text variant="xsmall" fontWeight="medium" color="text50">
                                                                             Amount:
                                                                      </Text>
                                                               </Box>
                                                               <Text variant="xsmall" fontWeight="semibold" color="text100">
                                                                      {formattedAmount} {symbol}
                                                               </Text>
                                                        </Box>
                                                 )
                                          })()}

                                          {parsedCall.type === 'erc721' && parsedCall.tokenId !== undefined && (
                                                 <Box flexDirection="row" gap="2" alignItems="center">
                                                        <Box style={{ minWidth: '80px' }}>
                                                               <Text variant="xsmall" fontWeight="medium" color="text50">
                                                                      Token ID:
                                                               </Text>
                                                        </Box>
                                                        <Text variant="xsmall" fontWeight="semibold" color="text100">
                                                               #{parsedCall.tokenId.toString()}
                                                        </Text>
                                                 </Box>
                                          )}

                                          {parsedCall.type === 'erc1155' && parsedCall.tokenId !== undefined && (
                                                 <Box flexDirection="column" gap="0.5">
                                                        <Box flexDirection="row" gap="2" alignItems="center">
                                                               <Box style={{ minWidth: '80px' }}>
                                                                      <Text variant="xsmall" fontWeight="medium" color="text50">
                                                                             Token ID:
                                                                      </Text>
                                                               </Box>
                                                               <Text variant="xsmall" fontWeight="semibold" color="text100">
                                                                      #{parsedCall.tokenId.toString()}
                                                               </Text>
                                                        </Box>
                                                        {parsedCall.amount !== undefined && (
                                                               <Box flexDirection="row" gap="2" alignItems="center">
                                                                      <Box style={{ minWidth: '80px' }}>
                                                                             <Text variant="xsmall" fontWeight="medium" color="text50">
                                                                                    Quantity:
                                                                             </Text>
                                                                      </Box>
                                                                      <Text variant="xsmall" fontWeight="semibold" color="text100">
                                                                             {parsedCall.amount.toString()}
                                                                      </Text>
                                                               </Box>
                                                        )}
                                                 </Box>
                                          )}
                                   </Box>
                            </Card>
                     ))}
              </Box>
       )
}

export default ExecutionDetails