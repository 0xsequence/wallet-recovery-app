import type { Payload } from '@0xsequence/wallet-primitives'
import type { Address, Hex } from 'viem'

export type QueuedRecoveryPayload = {
  id: string
  index: bigint
  recoveryModule: Address
  wallet: Address
  signer: Address
  chainId: number
  startTimestamp: bigint
  endTimestamp: bigint
  payloadHash: Hex
  payload?: Payload.Calls
}
