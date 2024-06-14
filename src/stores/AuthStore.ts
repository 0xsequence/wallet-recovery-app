import { ethers } from 'ethers'

import { NetworkConfig } from '@0xsequence/network'
import { LocalRelayer } from '@0xsequence/relayer'
import { Orchestrator } from '@0xsequence/signhub'

import { Store, observable } from '.'

import { TRACKER } from './TrackerStore'

import { SEQUENCE_CONTEXT } from '../constants/wallet-context'
import { normalizeAddress } from '../utils/address'
import { Account } from '@0xsequence/account'
import { prefixEIP191Message } from '../utils/signing'

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

  async signInWithRecoveryKey(recoveryKey: string) {
    const recoverySigner = ethers.Wallet.fromMnemonic(recoveryKey)

    // TODO: add ability to pick a specific wallet
    const wallets = await TRACKER.walletsOfSigner({ signer: recoverySigner.address })
    const wallet = wallets[0]

    const orchestrator = new Orchestrator([recoverySigner])

    const account = new Account({
      address: wallet.wallet,
      tracker: TRACKER,
      contexts: SEQUENCE_CONTEXT,
      orchestrator: orchestrator,
      networks: [testNetworkConfig]
    })

    console.log('account', account.address)

    try {
      // TODO: for testing, remove
      const preparedMessage = prefixEIP191Message('message message')
      console.log(await account.signMessage(preparedMessage, 137))
    } catch (error) {
      console.warn(error)
    }
  }
}
