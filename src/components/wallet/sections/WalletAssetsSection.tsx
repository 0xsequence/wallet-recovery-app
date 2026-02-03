import { Text } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import CollectibleList from '~/components/wallet/collectibles/CollectibleList'
import TokenList from '~/components/wallet/tokens/TokenList'
import { AssetDiscoveryInfoBox } from '~/components/wallet/AssetDiscoveryInfoBox'

interface WalletAssetsSectionProps {
  onTokenSendClick: (tokenBalance: TokenBalance) => void
  onCollectibleSendClick: (collectibleInfo: CollectibleInfo) => void
}

/**
 * Section displaying wallet tokens and collectibles
 */
export function WalletAssetsSection({ onTokenSendClick, onCollectibleSendClick }: WalletAssetsSectionProps) {
  return (
    <div className='flex flex-col gap-5 mt-10'>
      <Text variant="small" fontWeight="bold" color="text50">
        My Sequence wallet
      </Text>

      <AssetDiscoveryInfoBox />

      <TokenList onSendClick={onTokenSendClick} />

      <CollectibleList onSendClick={onCollectibleSendClick} />
    </div>
  )
}
