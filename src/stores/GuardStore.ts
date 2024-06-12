import { AuthMethod, GuardSigner, OwnershipProof } from '@0xsequence/guard'

import { V2_GUARD_SERVICE } from '../constants/wallet-context'

import { SignerStore } from './SignerStore'

import { observable, Store } from './index'

export class GuardStore {
  private v2GuardSigner = new GuardSigner(V2_GUARD_SERVICE.address, V2_GUARD_SERVICE.hostname)

  authMethods = observable<{ methods: AuthMethod[]; active: boolean } | undefined>(undefined)

  constructor(private store: Store) {}

  private async getOwnershipProof(accountAddress: string): Promise<OwnershipProof | undefined> {
    const signerStore = this.store.get(SignerStore)

    const walletAddress = accountAddress
    const { signers } = signerStore

    if (walletAddress && signers.recoverySigner) {
      return { walletAddress, signer: signers.recoverySigner }
    }

    return
  }

  async getAuthMethods(accountAddress: string) {
    const authMethods = this.authMethods.get()

    if (authMethods) {
      return authMethods
    }

    return this.fetchAuthMethods(accountAddress)
  }

  async fetchAuthMethods(accountAddress: string) {
    const proof = await this.getOwnershipProof(accountAddress)

    if (proof) {
      try {
        const authMethods = await this.v2GuardSigner.getAuthMethods(proof)
        this.authMethods.set(authMethods)
        return authMethods
      } catch (error) {
        throw new Error(`GuardStore: Unable to fetch guard auth methods using provided token. ${error.message}`)
      }
    }

    throw new Error('GuardStore: Unable to fetch guard auth methods using provided token.')
  }
}
