import { trackers } from '@0xsequence/sessions'

export const TRACKER = new trackers.arweave.ArweaveReader({
  graphqlUrl: 'https://arweave-search.goldsky.com/graphql'
})
