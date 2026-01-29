import { Box, Text } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import CollectibleList from '~/components/wallet/collectibles/CollectibleList'
import TokenList from '~/components/wallet/tokens/TokenList'

interface WalletAssetsSectionProps {
  onTokenSendClick: (tokenBalance: TokenBalance) => void
  onCollectibleSendClick: (collectibleInfo: CollectibleInfo) => void
}

/**
 * Section displaying wallet tokens and collectibles
 */
export function WalletAssetsSection({ onTokenSendClick, onCollectibleSendClick }: WalletAssetsSectionProps) {
  return (
    <Box flexDirection="column" gap="5">
      <Text variant="small" fontWeight="bold" color="text50">
        My Sequence wallet
      </Text>

      <TokenList onSendClick={onTokenSendClick} />

      <CollectibleList onSendClick={onCollectibleSendClick} />
    </Box>
  )
}
