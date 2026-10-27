import { trackers } from '@0xsequence/sessions'

export const DEFAULT_TRACKER_OPTIONS: trackers.arweave.Options = {
  arweaveUrl: trackers.arweave.defaults.arweaveUrl,
  graphqlUrl: 'https://arweave-search.goldsky.com/graphql'
}

export const TRACKER_OPTIONS = { ...DEFAULT_TRACKER_OPTIONS }

export const TRACKER = new trackers.arweave.ArweaveReader(TRACKER_OPTIONS)
