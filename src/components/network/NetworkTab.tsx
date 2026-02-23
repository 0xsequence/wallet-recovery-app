import { NetworkType } from '@0xsequence/network'
import { TabsTrigger } from '@0xsequence/design-system'

export default function NetworkTab({
  value
}: {
  value: NetworkType | 'arweave'
}) {
  const networkTypeString =
    value === NetworkType.MAINNET ? 'Mainnets' : value === NetworkType.TESTNET ? 'Testnets' : 'Arweave'

  return (
    <TabsTrigger
      value={value}
      className='h-8 px-4'
    >
      {networkTypeString}
    </TabsTrigger>
  )
}
