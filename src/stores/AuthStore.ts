import { ethers } from 'ethers'
import { Session, SessionDumpV1, SessionDumpV2 } from '@0xsequence/auth'
import { commons, universal } from '@0xsequence/core'
import { NetworkConfig } from '@0xsequence/network'
import { LocalRelayer } from '@0xsequence/relayer'

import { Store, observable } from '.'
import { LocalStore } from './LocalStore'
import { SignerStore } from './SignerStore'
import { TRACKER } from './TrackerStore'

import { DEFAULT_THRESHOLD, SignerLevel } from '../constants/sessions'
import { LocalStorageKey } from '../constants/storage'
import { SEQUENCE_CONTEXT, V1_GUARD_SERVICE, V1_TESTNET_GUARD, V2_GUARD_SERVICE } from '../constants/wallet-context'
import { normalizeAddress } from '../utils/address'

// TODO: temporary, remove/update once sessions work is done
const serviceSettings = {
  sequenceApiUrl: 'https://api.sequence.app',
  sequenceApiChainId: 137,
  sequenceMetadataUrl: 'https://metadata.sequence.app',
  metadata: {
    name: 'Sequence Wallet',
    expiration: 60 * 60 * 24 * 30
  }
}

// THROWAWAY_RELAYER_PK is the private key to an account with some ETH on Rinkeby we can use for debugging.
//
// Public account address: 0x9e7fFFfA6bdD755e4dE6659677145782D9dF1a4e
// Etherscan link: https://rinkeby.etherscan.io/address/0x9e7fFFfA6bdD755e4dE6659677145782D9dF1a4e
const THROWAWAY_RELAYER_PK = '0xa9e1f06cb24d160e02bd6ea84d6ffd0b3457b53d1177382eee85f4d8013419b8'

export const createDebugLocalRelayer = (provider: string | ethers.providers.JsonRpcProvider) => {
  const signer = new ethers.Wallet(THROWAWAY_RELAYER_PK)
  if (typeof provider === 'string') {
    return new LocalRelayer(signer.connect(new ethers.providers.JsonRpcProvider(provider)))
  } else {
    return new LocalRelayer(signer.connect(provider))
  }
}

// Test network config, will be replaced with a network store that allows modification
const testNetworkConfig: NetworkConfig = {
  name: 'Polygon',
  chainId: 137,
  rpcUrl: 'https://polygon.drpc.org',
  relayer: createDebugLocalRelayer('https://polygon.drpc.org')
}

export class AuthStore {
  constructor(private store: Store) {}

  availableWallets = observable<string[]>([])

  selectedWallet = observable<string | undefined>(undefined)

  accountAddress = observable<string | undefined>(undefined)

  private local = {
    // configuration of the current logged in wallet
    session: new LocalStore<SessionDumpV1 | SessionDumpV2>(LocalStorageKey.SESSION_DUMP),

    // login key public address (aka the torus key)
    loginKeyAddress: new LocalStore(LocalStorageKey.LOGIN_KEY_ADDRESS)

    // TODO: check if needed
    // v2MigrationNotice: new LocalStore<V2MigrationDetails>(LocalStorageKey.V2_MIGRATION_NOTICE)
  }

  async signInWithRecoveryKey(recoveryKey: string) {
    const signerStore = this.store.get(SignerStore)

    const recoverySigner = ethers.Wallet.fromMnemonic(recoveryKey)
    signerStore.setRecoverySigner(recoverySigner)

    try {
      console.log('recovery key address:', recoverySigner.address)

      // XXX Do we really need this?
      // const sessionKey = await signerStore.decryptSessionKey()
      // const sessionDump = this.local.session.get()
      // if (sessionKey && sessionDump) {
      //    // Session already open, just store login key in memory and
      //    // don't open a new session
      //   return this.initWallet(recoverySigner)
      // }

      const sessionSigner = ethers.Wallet.createRandom()
      signerStore.setSessionSigner(sessionSigner)

      console.log('session key address:', sessionSigner.address)

      const session = await Session.open({
        settings: {
          services: serviceSettings,
          contexts: SEQUENCE_CONTEXT,
          networks: [testNetworkConfig],
          tracker: TRACKER
        },
        orchestrator: signerStore,
        referenceSigner: recoverySigner.address,
        addSigners: [
          {
            address: sessionSigner.address,
            weight: SignerLevel.SILVER
          },
          {
            address: recoverySigner.address,
            weight: SignerLevel.RECOVERY
          }
        ],
        threshold: DEFAULT_THRESHOLD,
        selectWallet: (wallets: string[]) => {
          console.log('select wallet', wallets)

          return new Promise(resolve => {
            if (wallets.length === 0) {
              return resolve(undefined)
            }

            if (wallets.length === 1) {
              console.log('resolve', wallets[0])
              return resolve(wallets[0])
            }

            this.availableWallets.set(wallets)
            this.selectedWallet.subscribe(resolve)
          })
        },
        onAccountAddress: address => this.accountAddress.set(normalizeAddress(address)),
        editConfigOnMigration: (config: commons.config.Config) => {
          console.log('editConfigOnMigration')
          return this.migrateGuard(config)
        },
        onMigration: async () => {
          // TODO: check if this is needed
          // this.showV2MigrationNotice = true
          console.log('onMigration')
          return true
        }
      })

      console.log('adsasdasd')

      console.log('session?', session)

      console.log('session.services?', session.services)

      // Log authentication errors in case service is unreachable or down
      session.services?._initialAuthRequest.catch(console.error)

      session.services?.onAuth(async () => {
        console.log('Got auth, saving wallet')
        this.local.session.set(await session.dump())
      })

      console.log('Opened session, saving wallet')

      // TODO: check if needed
      // IMPORTANT: Remove the migration notice
      // this.local.v2MigrationNotice.del()

      // Save session to local storage
      this.local.session.set(await session.dump())

      // await this.initWallet(recoverySigner)
    } catch (error) {
      // TODO: go over this again
      console.warn('Error opening session', error)
      // this.store.get(AuthStore).setStage(AuthStageType.ERROR, error)
      // await this.resetWallet()
    }
  }

  migrateGuard = (config: commons.config.Config): commons.config.Config => {
    const coder = universal.genericCoderFor(config.version)
    return coder.config.editConfig(config, {
      add: [
        {
          address: V2_GUARD_SERVICE.address,
          weight: SignerLevel.GOLD
        }
      ],
      remove: [V1_GUARD_SERVICE.address, V1_TESTNET_GUARD.address]
    })
  }
}
