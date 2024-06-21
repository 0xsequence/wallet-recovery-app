import { ethers } from 'ethers'
import { Orchestrator } from '@0xsequence/signhub'
import { Account } from '@0xsequence/account'

import { Store, observable } from '.'
import { NetworkStore } from './NetworkStore'

import { SEQUENCE_CONTEXT } from '../constants/wallet-context'
import { IndexedDBKey } from '../constants/storage'

import { Encrypted, createKey, createSaltFromAddress, decrypt, encrypt } from '../utils/crypto'
import { clearIndexedDB, getIndexedDB } from '../utils/indexeddb'
import { TRACKER } from '../utils/tracker'

// import { normalizeAddress } from '../utils/address'
// import { prefixEIP191Message } from '../utils/signing'

export class AuthStore {
  constructor(private store: Store) {
    this.loadAccount()

    // Update Account when networks change
    const networkStore = this.store.get(NetworkStore)
    networkStore.networks.subscribe(_ => {
      if (this.account) {
        this.loadAccount()
      }
    })
  }

  account: Account | undefined

  availableWallets = observable<string[]>([])

  selectedWallet = observable<string | undefined>(undefined)

  accountAddress = observable<string | undefined>(undefined)

  async signInWithRecoveryMnemonic(mnemonic: string) {
    const recoverySigner = ethers.Wallet.fromMnemonic(mnemonic)

    const wallets = await TRACKER.walletsOfSigner({ signer: recoverySigner.address })

    const wallet = wallets[0]

    const orchestrator = new Orchestrator([recoverySigner])

    const networkStore = this.store.get(NetworkStore)
    const networks = networkStore.networks.get()

    try {
      const account = new Account({
        address: wallet.wallet,
        tracker: TRACKER,
        contexts: SEQUENCE_CONTEXT,
        orchestrator: orchestrator,
        networks: networks
      })

      await this.encryptRecoveryMnemonic(mnemonic, account.address)

      this.account = account
      this.accountAddress.set(account.address)
    } catch (error) {
      console.warn(error)
    }

    // try {
    //   // TODO: for testing, remove
    //   const preparedMessage = prefixEIP191Message('message message')
    //   console.log(await account.signMessage(preparedMessage, 137))
    // } catch (error) {
    //   console.warn(error)
    // }
  }

  async loadAccount() {
    const mnemonic = await this.decryptRecoveryMnemonic()

    if (mnemonic) {
      this.signInWithRecoveryMnemonic(mnemonic)
    }
  }

  async encryptRecoveryMnemonic(mnemonic: string, address: string) {
    // Create cryptoKey for encrypting sensitive data
    const key = await createKey()

    // Encrypt private key
    const encrypted = await encrypt(key, mnemonic)
    encrypted.salt = createSaltFromAddress(address)

    // Store encrypted data in indexed db
    const db = await getIndexedDB(IndexedDBKey.SECURITY)
    await db.put(IndexedDBKey.SECURITY, key, 'key')
    await db.put(IndexedDBKey.SECURITY, encrypted, 'mnemonic')
  }

  async decryptRecoveryMnemonic() {
    const db = await getIndexedDB(IndexedDBKey.SECURITY)
    const key = await db.get(IndexedDBKey.SECURITY, 'key')
    const encrypted: Encrypted = await db.get(IndexedDBKey.SECURITY, 'mnemonic')

    if (encrypted) {
      return decrypt(key, encrypted)
    }

    return undefined
  }

  logout() {
    this.account = undefined
    this.accountAddress.set(undefined)
    clearIndexedDB(IndexedDBKey.SECURITY)
  }
}
