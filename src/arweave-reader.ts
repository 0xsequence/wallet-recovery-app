import { State } from '@0xsequence/wallet-core'

export const arweaveReader = new State.Arweave.Reader({
  rateLimitRetryDelayMs: 10_000,
})
