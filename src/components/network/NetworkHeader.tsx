import { TabsList, Text } from '@0xsequence/design-system'
import { NetworkType } from '@0xsequence/network'

import NetworkTab from './NetworkTab'

export default function NetworkHeader() {
  return (
    <div className='flex flex-col w-full absolute bg-background-primary'>
      <div className='p-6'>
        <Text variant="large" fontWeight="bold" color="text80">
          Networks
        </Text>
        <TabsList className='mt-6 h-8 justify-start'>
          <NetworkTab value={NetworkType.MAINNET} />
          <NetworkTab value={NetworkType.TESTNET} />
          <NetworkTab value="arweave" />
        </TabsList>
      </div>
      <div className='h-0.5 bg-backgroundBackdrop' />
    </div>
  )
}
