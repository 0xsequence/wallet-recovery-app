import { ethers } from 'ethers'
import { NetworkConfig } from '@0xsequence/network'
import { LocalRelayer } from '@0xsequence/relayer'
import { Orchestrator } from '@0xsequence/signhub'
import { Account } from '@0xsequence/account'

import { Store, observable } from '.'

import { TRACKER } from './TrackerStore'

import { SEQUENCE_CONTEXT } from '../constants/wallet-context'
import { DEFAULT_PUBLIC_RPC_LIST } from '../constants/network'
import { IndexedDBKey } from '../constants/storage'

import { Encrypted, createKey, createSaltFromAddress, decrypt, encrypt } from '../utils/crypto'
import { clearIndexedDB, getIndexedDB } from '../utils/indexeddb'

// import { normalizeAddress } from '../utils/address'
// import { prefixEIP191Message } from '../utils/signing'

// TODO: remove once network work is done
const polygonRpcUrl = DEFAULT_PUBLIC_RPC_LIST.get(137)!

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
  rpcUrl: polygonRpcUrl,
  relayer: createDebugLocalRelayer(polygonRpcUrl)
}

export class AuthStore {
  constructor(private store: Store) {
    this.loadAccount()
  }

  account: Account | undefined

  availableWallets = observable<string[]>([])

  selectedWallet = observable<string | undefined>(undefined)

  accountAddress = observable<string | undefined>(undefined)

  async signInWithRecoveryMnemonic(mnemonic: string) {
    const recoverySigner = ethers.Wallet.fromMnemonic(mnemonic)

    // TODO: add ability to pick a specific wallet
    const wallets = await TRACKER.walletsOfSigner({ signer: recoverySigner.address })
    const wallet = wallets[0]

    const orchestrator = new Orchestrator([recoverySigner])

    try {
      const account = new Account({
        address: wallet.wallet,
        tracker: TRACKER,
        contexts: SEQUENCE_CONTEXT,
        orchestrator: orchestrator,
        networks: [testNetworkConfig]
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
