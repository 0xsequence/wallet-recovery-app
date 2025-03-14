import { Account } from '@0xsequence/account'
import { Orchestrator } from '@0xsequence/signhub'
import { ethers } from 'ethers'

import { createKey, createKeyFromPassword, createSaltFromAddress, decrypt, encrypt } from '~/utils/crypto'
import { clearIndexedDB, getIndexedDB } from '~/utils/indexeddb'
import { TRACKER } from '~/utils/tracker'

import { IndexedDBKey } from '~/constants/storage'
import { SEQUENCE_CONTEXT } from '~/constants/wallet-context'

import { Store, observable } from '.'
import { NetworkStore } from './NetworkStore'
import { TokenStore } from './TokenStore'

// import { normalizeAddress } from '~/utils/address'
// import { prefixEIP191Message } from '~/utils/signing'

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

    // Set account in network store to handle subsequent login after a logout
    this.accountAddress.subscribe(address => {
      if (address) {
        const networkStore = this.store.get(NetworkStore)
        networkStore.accountLoaded.set(true)
      }
    })
  }

  isLoadingAccount = observable(false)

  account: Account | undefined

  accountAddress = observable<string | undefined>(undefined)

  async signInWithRecoveryMnemonic(wallet: string, mnemonic: string, password?: string) {
    try {
      this.isLoadingAccount.set(true)

      const recoverySigner = ethers.Wallet.fromPhrase(mnemonic)

      const orchestrator = new Orchestrator([recoverySigner])

      const networkStore = this.store.get(NetworkStore)
      const networks = networkStore.networks.get()

      const account = new Account({
        address: wallet,
        tracker: TRACKER,
        contexts: SEQUENCE_CONTEXT,
        orchestrator: orchestrator,
        networks: networks
      })

      if (password) {
        await this.encryptRecoveryMnemonicWithPassword(mnemonic, account.address, password)
      } else {
        await this.encryptRecoveryMnemonic(mnemonic, account.address)
      }

      this.account = account
      this.accountAddress.set(account.address)
    } catch (error) {
      console.warn(error)
    }

    this.isLoadingAccount.set(false)
  }

  async loadAccount(password?: string) {
    const db = await getIndexedDB(IndexedDBKey.SECURITY)
    const encryptedMnemonic = await db.get(IndexedDBKey.SECURITY, 'mnemonic')
    if (encryptedMnemonic) {
      this.isLoadingAccount.set(true)
    }
    var key = await db.get(IndexedDBKey.SECURITY, 'key')

    let mnemonic: { wallet: string; mnemonic: string } | undefined = undefined

    if (encryptedMnemonic) {
      if (key) {
        mnemonic = await this.decryptRecoveryMnemonic(encryptedMnemonic, key)
      } else {
        mnemonic = await this.decryptRecoveryMnemonicWithPassword(encryptedMnemonic, password!)
      }
    }

    if (mnemonic) {
      if (password) {
        this.signInWithRecoveryMnemonic(mnemonic.wallet, mnemonic.mnemonic, password)
      } else {
        this.signInWithRecoveryMnemonic(mnemonic.wallet, mnemonic.mnemonic)
      }
    } else {
      setTimeout(() => {
        this.isLoadingAccount.set(false)
      }, 200)
    }
  }

  async encryptRecoveryMnemonic(mnemonic: string, address: string) {
    // Create cryptoKey for encrypting sensitive data
    const key = await createKey()

    // Encrypt private key
    const plaintext = JSON.stringify({ wallet: address, mnemonic })
    const encrypted = await encrypt(key, plaintext)
    encrypted.salt = createSaltFromAddress(address)

    // Store encrypted data in indexed db
    const db = await getIndexedDB(IndexedDBKey.SECURITY)
    await db.put(IndexedDBKey.SECURITY, key, 'key')
    await db.put(IndexedDBKey.SECURITY, encrypted, 'mnemonic')
  }

  async encryptRecoveryMnemonicWithPassword(mnemonic: string, address: string, password: string) {
    // Create cryptoKey with password for encrypting sensitive data
    const salt = createSaltFromAddress(address)
    const key = await createKeyFromPassword(password, salt)

    // Encrypt private key
    const plaintext = JSON.stringify({ wallet: address, mnemonic })
    const encrypted = await encrypt(key, plaintext)
    encrypted.salt = salt

    // Store encrypted data (minus key) in indexed db
    const db = await getIndexedDB(IndexedDBKey.SECURITY)
    await db.put(IndexedDBKey.SECURITY, encrypted, 'mnemonic')
  }

  async decryptRecoveryMnemonic(
    encryptedMnemonic: any,
    key: CryptoKey
  ): Promise<{ wallet: string; mnemonic: string }> {
    const plaintext = await decrypt(key, encryptedMnemonic)
    return JSON.parse(plaintext)
  }

  async decryptRecoveryMnemonicWithPassword(
    encryptedMnemonic: any,
    password: string
  ): Promise<{ wallet: string; mnemonic: string }> {
    const salt = encryptedMnemonic.salt
    const key = await createKeyFromPassword(password, salt!)
    const plaintext = await decrypt(key, encryptedMnemonic)
    return JSON.parse(plaintext)
  }

  logout() {
    this.account = undefined
    this.accountAddress.set(undefined)
    clearIndexedDB(IndexedDBKey.SECURITY)

    const networkStore = this.store.get(NetworkStore)
    const tokenStore = this.store.get(TokenStore)
    networkStore.clear()
    tokenStore.clear()

    // Not sure if we should abstract this to LocalStore but we'd have to instantiate a LocalStore to access the class function
    localStorage.clear()
  }
}
