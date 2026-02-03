import { Text, Card, Tooltip } from "@0xsequence/design-system"
import SendIcon from '~/assets/icons/send.svg'
import CoinIcon from '~/assets/icons/coin.svg'
import CollectionIcon from '~/assets/icons/collection.svg'
import { ethers } from 'ethers'
import { Address } from "viem"
import { truncateAddress } from "~/utils/truncateAddress"



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
              <div className='flex flex-col gap-1.5 mt-2'>
                     <div className='flex flex-row gap-1 items-center'>
                            <img src={SendIcon} style={{ width: '16px', height: '16px' }} />
                            <Text variant="small" fontWeight="medium" className='text-primary/80'>
                                   Transfers ({parsedCalls.length})
                            </Text>
                     </div>
                     {parsedCalls.map((parsedCall, idx) => (
                            <Card
                                   key={idx}
                                   className='flex flex-col gap-1 border border-border-normal rounded-sm p-2 bg-background-muted'
                            >
                                   <div className='flex flex-row gap-2 items-center'>
                                          {getTransferIcon(parsedCall.type) && (
                                                 <div className='p-1.5 bg-background-secondary rounded-sm flex items-center justify-center'>
                                                        <img src={getTransferIcon(parsedCall.type)!} style={{ width: '20px', height: '20px' }} />
                                                 </div>
                                          )}
                                          <div className='flex flex-col gap-0.25 flex-1'>
                                                 <Text variant="small" fontWeight="medium" className='text-primary/80'>
                                                        {getTransferTypeLabel(parsedCall)}
                                                 </Text>
                                                 <Text variant="xsmall" className='text-primary/50'>
                                                        {parsedCall.description}
                                                 </Text>
                                          </div>
                                   </div>

                                   <div className='h-0.5 bg-background-active' />

                                   <div className='flex flex-col gap-1'>
                                          {parsedCall.recipient && (
                                                 <div className='flex flex-row gap-2 items-center'>
                                                        <div className='min-w-20'>
                                                               <Text variant="xsmall" fontWeight="medium" className='text-primary/50'>
                                                                      Recipient:
                                                               </Text>
                                                        </div>
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
                                                                      className='text-primary/80'
                                                               >
                                                                      {truncateAddress(parsedCall.recipient, 6, 4)}
                                                               </Text>
                                                        </Tooltip>
                                                 </div>
                                          )}

                                          {(parsedCall.type === 'native' || parsedCall.type === 'erc20') && parsedCall.amount !== undefined && (() => {
                                                 const decimals = parsedCall.type === 'native' ? 18 : tokenMetadata.get(parsedCall.contractAddress!)?.decimals ?? 18
                                                 const symbol = parsedCall.type === 'native' ? 'ETH' : tokenMetadata.get(parsedCall.contractAddress!)?.symbol ?? 'tokens'

                                                 const amountStr = parsedCall.amount.toString()
                                                 const formattedAmount = ethers.formatUnits(amountStr, decimals)

                                                 return (
                                                        <div className='flex flex-row gap-2 items-center'>
                                                               <div className='min-w-20'>
                                                                      <Text variant="xsmall" fontWeight="medium" className='text-primary/50'>
                                                                             Amount:
                                                                      </Text>
                                                               </div>
                                                               <Text variant="xsmall" fontWeight="semibold" className='text-primary/80'>
                                                                      {formattedAmount} {symbol}
                                                               </Text>
                                                        </div>
                                                 )
                                          })()}

                                          {parsedCall.type === 'erc721' && parsedCall.tokenId !== undefined && (
                                                 <div className='flex flex-row gap-2 items-center'>
                                                        <div className='min-w-20'>
                                                               <Text variant="xsmall" fontWeight="medium" className='text-primary/50'>
                                                                      Token ID:
                                                               </Text>
                                                        </div>
                                                        <Text variant="xsmall" fontWeight="semibold" className='text-primary/80'>
                                                               #{parsedCall.tokenId.toString()}
                                                        </Text>
                                                 </div>
                                          )}

                                          {parsedCall.type === 'erc1155' && parsedCall.tokenId !== undefined && (
                                                 <div className='flex flex-col gap-0.5'>
                                                        <div className='flex flex-row gap-2 items-center'>
                                                               <div className='min-w-20'>
                                                                      <Text variant="xsmall" fontWeight="medium" className='text-primary/50'>
                                                                             Token ID:
                                                                      </Text>
                                                               </div>
                                                               <Text variant="xsmall" fontWeight="semibold" className='text-primary/80'>
                                                                      #{parsedCall.tokenId.toString()}
                                                               </Text>
                                                        </div>
                                                        {parsedCall.amount !== undefined && (
                                                               <div className='flex flex-row gap-2 items-center'>
                                                                      <div className='min-w-20'>
                                                                             <Text variant="xsmall" fontWeight="medium" className='text-primary/50'>
                                                                                    Quantity:
                                                                             </Text>
                                                                      </div>
                                                                      <Text variant="xsmall" fontWeight="semibold" className='text-primary/80'>
                                                                             {parsedCall.amount.toString()}
                                                                      </Text>
                                                               </div>
                                                        )}
                                                 </div>
                                          )}
                                   </div>
                            </Card>
                     ))}
              </div>
       )
}

export default ExecutionDetails