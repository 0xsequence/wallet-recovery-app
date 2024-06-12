import { commons } from '@0xsequence/core'
import { signers, Status } from '@0xsequence/signhub'
import { BytesLike } from 'ethers'

export type EncryptedSessionSignerCallback = (message: BytesLike) => Promise<string>

export class EncryptedSessionSigner implements signers.SapientSigner {
  constructor(public readonly address: string, public readonly callback: EncryptedSessionSignerCallback) {}

  isReady(): boolean {
    return true
  }

  getAddress() {
    return Promise.resolve(this.address)
  }

  async buildDeployTransaction(_metadata: object): Promise<commons.transaction.TransactionBundle | undefined> {
    return undefined
  }

  async predecorateSignedTransactions(_metadata: object): Promise<commons.transaction.SignedTransactionBundle[]> {
    return []
  }

  async decorateTransactions(
    bundle: commons.transaction.IntendedTransactionBundle,
    _metadata: object
  ): Promise<commons.transaction.IntendedTransactionBundle> {
    return bundle
  }

  sign(message: BytesLike, _metadata: object): Promise<BytesLike> {
    return this.callback(message)
  }

  notifyStatusChange(_id: string, _status: Status, _metadata: object): void {}

  suffix(): BytesLike {
    return [2]
  }
}
