import { ethers } from 'ethers'
import { Session, SessionDumpV1, SessionDumpV2 } from '@0xsequence/auth'
import { commons } from '@0xsequence/core'
import { NetworkConfig } from '@0xsequence/network'

import { Store, observable } from '.'
import { LocalStore } from './LocalStore'
import { SignerStore } from './SignerStore'
import { TRACKER } from './TrackerStore'

import { DEFAULT_THRESHOLD, SignerLevel } from '../constants/sessions'
import { LocalStorageKey } from '../constants/storage'
import { SEQUENCE_CONTEXT } from '../constants/wallet-context'
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

// Test network config, will be replaced with a network store that allows modification
const testNetworkConfig: NetworkConfig = {
  name: 'Ethereum',
  chainId: 1,
  rpcUrl: 'https://eth.llamarpc.com'
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
            address: await signerStore.signers.guardSignerV2.getAddress(),
            weight: SignerLevel.GOLD
          },
          // {
          //   address: await signerStore.signers.loginSigner.getAddress(),
          //   weight: SignerLevel.GOLD
          // },
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
              return resolve(wallets[0])
            }

            this.availableWallets.set(wallets)
            this.selectedWallet.subscribe(resolve)
          })
        },
        onAccountAddress: address => this.accountAddress.set(normalizeAddress(address)),
        editConfigOnMigration: (config: commons.config.Config) => {
          // TODO: check if this is needed
          // return this.migrateGuard(config)
          return config
        },
        onMigration: async () => {
          // TODO: check if this is needed
          // this.showV2MigrationNotice = true

          return true
        }
      })

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
      // TODO: check this part later
      // Sentry.captureException(error)
      // console.warn('Error opening session', error)
      // this.store.get(AuthStore).setStage(AuthStageType.ERROR, error)
      // await this.resetWallet()
    }
  }
}
