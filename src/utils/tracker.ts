import { trackers } from '@0xsequence/sessions'

export const DEFAULT_TRACKER_OPTIONS: trackers.arweave.Options = {
  arweaveUrl: trackers.arweave.defaults.arweaveUrl,
  graphqlUrl: 'https://arweave-search.goldsky.com/graphql',
  // Only read what Sequence's key machine published, anyone can upload items with the same tags
  owners: ['0xA27b3EDE035dE132DA35f115bB5614D421f3201f']
}

export const TRACKER_OPTIONS = { ...DEFAULT_TRACKER_OPTIONS }

export const TRACKER = new trackers.arweave.ArweaveReader(TRACKER_OPTIONS)
