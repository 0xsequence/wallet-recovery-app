import { AuthMethod, GuardSigner, OwnershipProof } from '@0xsequence/guard'

import { V2_GUARD_SERVICE } from '../constants/wallet-context'

import { observable, Store } from './index'
import { SignerStore } from './SignerStore'
import { AuthStore } from './AuthStore'

export class GuardStore {
  private v2GuardSigner = new GuardSigner(V2_GUARD_SERVICE.address, V2_GUARD_SERVICE.hostname)

  authMethods = observable<{ methods: AuthMethod[]; active: boolean } | undefined>(undefined)

  constructor(private store: Store) {}

  private async getOwnershipProof(): Promise<OwnershipProof | undefined> {
    const signerStore = this.store.get(SignerStore)
    const authStore = this.store.get(AuthStore)

    const walletAddress = authStore.accountAddress.get()

    const { signers } = signerStore

    if (walletAddress && signers.recoverySigner) {
      return { walletAddress, signer: signers.recoverySigner }
    }

    return
  }

  async getAuthMethods() {
    const authMethods = this.authMethods.get()

    if (authMethods) {
      return authMethods
    }

    return this.fetchAuthMethods()
  }

  async fetchAuthMethods() {
    const proof = await this.getOwnershipProof()

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
