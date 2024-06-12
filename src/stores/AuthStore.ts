import { ethers } from 'ethers'
import { Store } from '.'
import { SEQUENCE_CONTEXT } from '../constants/wallet-context'

import { SignerStore } from './SignerStore'

export class AuthStore {
  constructor(private store: Store) {}

  async signInWithRecoveryKey(recoveryKey: string) {
    const signerStore = this.store.get(SignerStore)

    console.log('loginStore, loginWallet...')

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
          services: this.getServiceSettings(),
          contexts: SEQUENCE_CONTEXT,
          networks: this.store.get(NetworkStore).networks.get(),
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
        selectWallet: (wallets: string[]) =>
          new Promise(resolve => {
            // Devmode can force the creation of a new wallet
            // even if there are already wallets available
            // NOTICE: Remove this when we native support creation of multiple wallets
            const devmodeStore = this.store.get(DevmodeStore)
            if (devmodeStore.forceCreateWallet.get()) {
              return resolve(undefined)
            }

            if (wallets.length === 0) {
              return resolve(undefined)
            }

            if (wallets.length === 1) {
              return resolve(wallets[0])
            }

            this.availableWallets.set(wallets)
            this.selectedWallet.subscribe(resolve)
          }),
        onAccountAddress: address => this.accountAddress.set(normalizeAddress(address)),
        editConfigOnMigration: (config: commons.config.Config) => {
          return this.migrateGuard(config)
        },
        onMigration: async () => {
          this.showV2MigrationNotice = true

          return true
        }
      })

      this.store.get(ClientStore).injectSession(session)

      // Log authentication errors in case service is unreachable or down
      session.services?._initialAuthRequest.catch(console.error)

      session.services?.onAuth(async () => {
        console.log('Got auth, saving wallet')
        this.local.session.set(await session.dump())
      })

      console.log('Opened session, saving wallet')

      // analytics -- track the user session with wallet as seed
      //
      // NOTE: we will not use the user's wallet address in the analytics.
      // as the address will be hashed in combination with their user-agent
      analytics.identify(session.account.address)

      // IMPORTANT: Remove the migration notice
      this.local.v2MigrationNotice.del()

      // Save session to local storage
      this.local.session.set(await session.dump())

      await this.initWallet(recoverySigner)
    } catch (error) {
      Sentry.captureException(error)
      console.warn('Error opening session', error)
      this.store.get(AuthStore).setStage(AuthStageType.ERROR, error)
      await this.resetWallet()
    }
  }
}
