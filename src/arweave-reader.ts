import { State } from '@0xsequence/wallet-core'

const arweaveSource: State.Reader = new State.Arweave.Reader({
  rateLimitRetryDelayMs: 10_000,
})

const arweaveProvider: State.Provider = {
  getConfiguration: imageHash => arweaveSource.getConfiguration(imageHash),
  getDeploy: wallet => arweaveSource.getDeploy(wallet),
  getWallets: signer => arweaveSource.getWallets(signer),
  getWalletsForSapient: (signer, imageHash) => arweaveSource.getWalletsForSapient(signer, imageHash),
  getWitnessFor: (wallet, signer) => arweaveSource.getWitnessFor(wallet, signer),
  getWitnessForSapient: (wallet, signer, imageHash) =>
    arweaveSource.getWitnessForSapient(wallet, signer, imageHash),
  getConfigurationUpdates: (wallet, fromImageHash, options) =>
    arweaveSource.getConfigurationUpdates(wallet, fromImageHash, options),
  getTree: rootHash => arweaveSource.getTree(rootHash),
  getPayload: opHash => arweaveSource.getPayload(opHash),
  saveWallet: () => undefined,
  saveWitnesses: () => undefined,
  saveUpdate: () => undefined,
  saveTree: () => undefined,
  saveConfiguration: () => undefined,
  saveDeploy: () => undefined,
  savePayload: () => undefined,
}

const arweaveCache = new State.Local.Provider(
  new State.Local.IndexedDbStore('sequence-arweave-cache')
)

export const arweaveReader: State.Reader = new State.Cached({
  source: arweaveProvider,
  cache: arweaveCache,
})
