import { trackers } from '@0xsequence/sessions'
import { ethers } from 'ethers'

import { SEQUENCE_CONTEXT } from '../constants/wallet-context'

// TODO: temporary, remove/update once sessions work is done
export const LOCAL_TRACKER = new trackers.DedupedTracker(
  new trackers.local.LocalConfigTracker(
    new ethers.providers.StaticJsonRpcProvider('https://eth.llamarpc.com'),
    new trackers.stores.IndexedDBStore('local-tracker-v1.0.1')
  ),
  50
)

// TODO: temporary, remove/update once sessions work is done
export const TRACKER = new trackers.DedupedTracker(
  new trackers.CachedTracker(
    new trackers.DedupedTracker(new trackers.remote.RemoteConfigTracker('https://sessions.sequence.app'), 50),
    LOCAL_TRACKER,
    SEQUENCE_CONTEXT
  ),
  50
)
