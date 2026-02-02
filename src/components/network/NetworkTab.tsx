import { Text } from '@0xsequence/design-system'
import { TabsPrimitive } from '@0xsequence/design-system'
import { NetworkType } from '@0xsequence/network'

export default function NetworkTab({
  value,
  selectedNetworkType
}: {
  value: string
  selectedNetworkType: NetworkType | 'arweave'
}) {
  const networkTypeString =
    value === NetworkType.MAINNET ? 'Mainnets' : value === NetworkType.TESTNET ? 'Testnets' : 'Arweave'

  return (
    <TabsPrimitive.TabsTrigger
      value={value}
      style={{
        backgroundColor: 'inherit',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      <Text
        variant="normal"
        fontWeight="semibold"
        color={selectedNetworkType === value ? 'text100' : 'text50'}
        className='px-4'
      >
        {networkTypeString}
      </Text>
      {selectedNetworkType === value && (
        <div className='h-0.5 bg-backgroundBackdrop relative top-1.5' />
      )}
    </TabsPrimitive.TabsTrigger>
  )
}
