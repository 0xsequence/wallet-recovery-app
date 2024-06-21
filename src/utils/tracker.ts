import { trackers } from '@0xsequence/sessions'
import { ethers } from 'ethers'

import { SEQUENCE_CONTEXT } from '../constants/wallet-context'
import { DEFAULT_PUBLIC_RPC_LIST } from '../constants/network'

// TODO: remove once network work is done, this should use rpc from NetworkStore.networks
const polygonRpcUrl = DEFAULT_PUBLIC_RPC_LIST.get(137)

// TODO: temporary, remove/update once sessions work is done
export const LOCAL_TRACKER = new trackers.DedupedTracker(
  new trackers.local.LocalConfigTracker(
    new ethers.providers.StaticJsonRpcProvider(polygonRpcUrl),
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
