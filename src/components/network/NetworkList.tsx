
import { NetworkConfig } from '@0xsequence/network'

import NetworkItem from './NetworkItem'

export default function NetworkList({ networks }: { networks: NetworkConfig[] }) {
  return (
    <div className='flex flex-col gap-3 p-6'>
      {networks.map((network, i) => (
        <NetworkItem key={i} network={network} />
      ))}
    </div>
  )
}
