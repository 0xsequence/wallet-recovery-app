import { Text } from '@0xsequence/design-system'
import DappList from '~/components/wallet/dapps/DappList'
import ExternalWallet from '~/components/wallet/externalprovider/ExternalWallet'

/**
 * Section displaying external wallet connections and connected dApps
 */
export function WalletConnectionsSection() {
  return (
    <div className='flex flex-col gap-5'>
      <Text variant="small" fontWeight="bold" color="text50">
        External connections
      </Text>

      <ExternalWallet />

      <DappList />
    </div>
  )
}
