import { Card, IconButton, SendIcon, Text, TokenImage, tokenImageUrl } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'

import { truncateNumber } from '~/utils/bignumber'
import { getNativeTokenInfo } from '~/utils/network'

import NetworkTag from '~/components/network/NetworkTag'

export default function TokenBalanceItem({
  disabled,
  tokenBalance,
  onSendClick,
}: {
  disabled?: boolean
  tokenBalance: TokenBalance
  onSendClick: () => void
}) {
  const formattedBalance = ethers.formatUnits(tokenBalance.balance, tokenBalance.contractInfo?.decimals ?? 18)
  const truncatedBalance = truncateNumber(Number(formattedBalance), 5)
  const nativeTokenInfo = tokenBalance.contractType === 'NATIVE'
    ? getNativeTokenInfo(tokenBalance.chainId as Parameters<typeof getNativeTokenInfo>[0])
    : null
  const tokenName = tokenBalance.contractInfo?.name ?? nativeTokenInfo?.name ?? 'Unknown token'
  const tokenSymbol = tokenBalance.contractInfo?.symbol ?? nativeTokenInfo?.symbol ?? tokenName
  const tokenImageSrc = tokenBalance.contractInfo?.logoURI || tokenImageUrl(tokenBalance.chainId, tokenBalance.contractAddress)

  return (
    <Card className='flex flex-row items-center gap-3'>
      <TokenImage
        src={tokenImageSrc}
        symbol={tokenSymbol}
        withNetwork={tokenBalance.chainId}
        size="md"
        className='size-6'
      />

      <div className='flex flex-col'>
        <div className='flex flex-row items-center gap-2'>
          <Text variant="normal" fontWeight="bold" color="text80">
            {tokenName}
          </Text>

          <NetworkTag chainId={tokenBalance.chainId} />
        </div>

        <Text variant="normal" fontWeight="medium" color="text50" className='text-xs'>
          {truncatedBalance} {tokenSymbol}
        </Text>
      </div>

      <div className='flex flex-row items-center ml-auto gap-3'>
        <IconButton shape="square" icon={SendIcon} size="sm" disabled={disabled} onClick={onSendClick} />
      </div>
    </Card>
  )
}
