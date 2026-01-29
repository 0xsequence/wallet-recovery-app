import { State } from '@0xsequence/wallet-core'
import { Sequence } from '@0xsequence/wallet-wdk'

import { networks } from './networks'

const VITE_KEYMACHINE_URL = "https://sessions.sequence.app"

let stateProvider: State.Provider | undefined

const localStateProvider = new State.Local.Provider(
  new State.Local.IndexedDbStore('sequence-cache')
)

/*if (!VITE_KEYMACHINE_URL) {
  console.error('VITE_KEYMACHINE_URL is not set. Using local state provider.')
  stateProvider = localStateProvider
} else {
  stateProvider = new State.Cached({
    source: new State.Sequence.Provider(VITE_KEYMACHINE_URL),
    cache: localStateProvider,
  })
}*/

stateProvider = new State.Cached({
  source: new State.Sequence.Provider(VITE_KEYMACHINE_URL),
  cache: localStateProvider,
})

export const manager = new Sequence.Manager({
  networks,
  multiInjectedProviderDiscovery: true,
  stateProvider,
  defaultRecoverySettings: {
    requiredDeltaTime: 2592000n, // 30 days (in seconds)
    minTimestamp: 0n,
  },
})
