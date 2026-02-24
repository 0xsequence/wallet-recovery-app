import { Button, Card, InfoIcon, Text } from '@0xsequence/design-system'
import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import ExternalLinkIcon from '~/assets/icons/external-link-arrow.svg'

export function AssetDiscoveryInfoBox() {
  const authStore = useStore(AuthStore)
  const walletAddress = useObservable(authStore.accountAddress)


  return (
    <Card
      className='flex flex-col gap-3 p-4 bg-background-raised/90'
    >
      <div className='flex flex-col gap-2'>

        <div className='flex flex-row items-center gap-2'>
          <InfoIcon />
          <Text variant="medium" fontWeight="bold" color="text100">
            View your wallet assets
          </Text>
        </div>

        <Text variant="small" color="text80">
          We may not be able to automatically discover every token or NFT in your wallet.
          You can view your full balance, then add the assets you want to recover here.
        </Text>
      </div>

      <a href={`https://blockscan.com/address/${walletAddress}`} target='_blank' rel='noopener noreferrer'>
        <Button
          variant="primary"
          size="sm"
          shape="square"
          disabled={!walletAddress}
          className='flex flex-row items-center gap-2 mt-1'
        >
          <Text variant="normal" fontWeight="bold" color="text100">
            View wallet balance
          </Text>
          <img src={ExternalLinkIcon} alt="External link" className='w-4 h-4' />
        </Button></a>
    </Card>
  )
}
