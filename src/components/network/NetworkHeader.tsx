import { TabsPrimitive, Text } from '@0xsequence/design-system'
import { NetworkType } from '@0xsequence/network'

import NetworkTab from './NetworkTab'

export default function NetworkHeader({
  selectedNetworkType
}: {
  selectedNetworkType: NetworkType | 'arweave'
}) {
  return (
    <div className='flex flex-col w-full absolute bg-background-primary'>
      <div className='p-6'>
        <Text variant="large" fontWeight="bold" color="text80">
          Networks
        </Text>
        <TabsPrimitive.TabsList style={{ marginTop: '24px' }}>
          <div className='flex flex-row' style={{ height: '32px' }}>
            <NetworkTab value={NetworkType.MAINNET} selectedNetworkType={selectedNetworkType} />

            <NetworkTab value={NetworkType.TESTNET} selectedNetworkType={selectedNetworkType} />

            <NetworkTab value="arweave" selectedNetworkType={selectedNetworkType} />
          </div>
        </TabsPrimitive.TabsList>
      </div>
      <div className='h-0.5 bg-backgroundBackdrop' />
    </div>
  )
}
