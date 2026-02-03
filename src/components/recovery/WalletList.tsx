import { CheckmarkIcon, Text } from '@0xsequence/design-system'
import { truncateAddress } from '~/utils/truncateAddress'
import { Address } from 'viem'

export default function WalletList({
  possibleWallets,
}: {
  possibleWallets: string[]
}) {
  return (
    <div className='flex flex-col gap-2'>
      <Text variant="normal" fontWeight="medium" color="text80">
        Wallet found
      </Text>

      {possibleWallets.map(wallet => {
        return (
          <div key={wallet}>
            <div className='flex flex-row items-center gap-2' style={{ height: '52px' }}>
              <div className='bg-background-raised rounded-md flex items-center h-full p-4 w-full gap-2'>
                <CheckmarkIcon className={"w-4 h-4 text-positive"} />

                <Text
                  variant="normal"
                  fontWeight="medium"
                  className='text-primary/80'
                  style={{ fontFamily: 'monospace' }}
                >
                  {truncateAddress(wallet as Address, 20, 6)}
                </Text>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
