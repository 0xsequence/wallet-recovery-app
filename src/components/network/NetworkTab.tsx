import { Divider, Text } from '@0xsequence/design-system'
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
        paddingX="4"
      >
        {networkTypeString}
      </Text>
      {selectedNetworkType === value && (
        <Divider color="white" height="0.5" position="relative" marginY="0" style={{ top: '6px' }} />
      )}
    </TabsPrimitive.TabsTrigger>
  )
}
