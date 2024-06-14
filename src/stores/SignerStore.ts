import { commons, universal } from '@0xsequence/core'
import { AuthMethod, GuardSigner } from '@0xsequence/guard'
import { isSignerStatusPending, Orchestrator, SignatureOrchestrator, signers, SignerState, Status } from '@0xsequence/signhub'
import { BytesLike, Wallet } from 'ethers'

// import { IndexedDBKey, LocalStorageKey } from '~/constants/storage'
import { V1_GUARD_SERVICE, V1_TESTNET_GUARD, V2_GUARD_SERVICE } from '../constants/wallet-context'
import { EncryptedSessionSigner } from '../signers/EncryptedSessionSigner'
import { createKey, createSaltFromAddress, decrypt, encrypt, Encrypted } from '../utils/crypto'
import { getIndexedDB } from '../utils/indexeddb'
import { LocalStorageKey } from '../constants/storage'

import { GuardStore } from './GuardStore'

// import { GuardStore } from './GuardStore'
import { LocalStore } from './LocalStore'

import { observable, Store } from './index'

export const CANCELLED = Symbol('CANCELLED')

export enum SignerType {
  GUARD,
  GUARD_TESTNET,
  SESSION,
  RECOVERY
}

export enum IndexedDBKey {
  SECURITY = 'security'
}

const getSignerType = async (signer: any) => {
  if (signer instanceof GuardSigner) {
    return SignerType.GUARD
  } else if (signer instanceof EncryptedSessionSigner) {
    return SignerType.SESSION
  } else if (signer instanceof signers.SignerWrapper) {
    if ((await signer.getAddress()) === V1_TESTNET_GUARD.address) {
      return SignerType.GUARD_TESTNET
    } else {
      return SignerType.RECOVERY
    }
  }

  console.error('unknown signer type', signer)
  throw new Error('unknown signer type')
}

const getSignerWeight = (signerAddress: any, config: commons.config.Config) => {
  const coder = universal.genericCoderFor(config.version)
  const signers = coder.config.signersOf(config)
  const signer = signers.find(signer => signer.address === signerAddress)
  return signer?.weight || 0
}

interface Signers {
  guardSignerV1: GuardSigner
  guardSignerV2: GuardSigner
  testnetGuardSignerV1: signers.SignerWrapper
  sessionSigner?: EncryptedSessionSigner
  recoverySigner?: signers.SignerWrapper
}

interface SignRequest {
  candidates: string[]
  message: BytesLike
  metadata: object
  callback: (status: Status, onNewMetadata: (metadata: object) => void) => boolean

  status: Status

  resolve: (status: Status) => void
  reject: (reason: any) => void
}

export enum SigningMode {
  NONE,
  MANAGER,
  GUARD_TOTP,
  RECOVERY_CODE,
  PASSWORDLESS
}

interface SignerMetadata {
  address: string
  weight: number
  type: SignerType
  enabled: boolean
  ready: boolean
  status: 'signed' | 'unsigned'
}

export class SignerStore implements SignatureOrchestrator {
  signers: Signers = {
    // Use GuardSigner for testnet and mainnet
    //
    // TODO: with new 0xsequence/stack/guard, we can use the same GUARD_SERVICE,
    // and it will automatically sign for the correct authChain (mainnet/testnet).
    // However, it does not make our wallet addresses universal because the local signer
    // will be different. So for now, we can keep this code below, but one day it will change
    guardSignerV1: new GuardSigner(V1_GUARD_SERVICE.address, V1_GUARD_SERVICE.hostname),
    guardSignerV2: new GuardSigner(V2_GUARD_SERVICE.address, V2_GUARD_SERVICE.hostname),

    testnetGuardSignerV1: new signers.SignerWrapper(V1_TESTNET_GUARD)
  }

  signerAddresses = new Map<signers.SapientSigner, string>()

  get sessionSignerAddress() {
    return this.getAddress(this.signers.sessionSigner!)
  }

  get recoverySignerAddress() {
    if (this.signers.recoverySigner) {
      return this.getAddress(this.signers.recoverySigner)
    }

    return undefined
  }

  mode = observable<SigningMode>(SigningMode.NONE)

  requests = observable<SignRequest[]>([])
  signerMetadata = observable<SignerMetadata[]>([])

  threshold = this.requests.select(requests => {
    if (requests.length === 0) {
      return Infinity
    }

    const metadata = requests.find(({ metadata }) => commons.isWalletSignRequestMetadata(metadata))?.metadata as
      | commons.WalletSignRequestMetadata
      | undefined

    if (!metadata) {
      return Infinity
    }

    return (metadata.config as any).threshold as number
  })

  weight = this.signerMetadata.select(signerMetadata =>
    signerMetadata.reduce((total, { status, weight }) => total + (status === 'signed' ? weight : 0), 0)
  )

  signWithGuard?: (totpCode?: string) => Promise<void>

  private local = {
    // XXX: legacy device/session private key - this will be removed in the future after accounts are migrated
    sessionKey: new LocalStore(LocalStorageKey.SESSION_KEY)
  }

  constructor(private store: Store) {
    this.setAddress(this.signers.guardSignerV1, V1_GUARD_SERVICE.address)
    this.setAddress(this.signers.guardSignerV2, V2_GUARD_SERVICE.address)
    this.setAddress(this.signers.testnetGuardSignerV1, V1_TESTNET_GUARD.address)

    this.requests.subscribe(async requests => {
      if (requests.length === 0) {
        this.signerMetadata.set([])
        return
      }

      const metadata = requests.find(({ metadata }) => commons.isWalletSignRequestMetadata(metadata))?.metadata as
        | commons.WalletSignRequestMetadata
        | undefined

      if (!metadata) {
        this.signerMetadata.set([])
        return
      }

      const signerMetadata: SignerMetadata[] = await Promise.all(
        [
          ...(this.signers.sessionSigner ? [this.signers.sessionSigner] : []),
          ...(this.signers.recoverySigner ? [this.signers.recoverySigner] : []),
          this.signers.guardSignerV2,
          this.signers.guardSignerV1,
          this.signers.testnetGuardSignerV1
        ]
          .filter(signer => getSignerWeight(this.getAddress(signer), metadata.config) !== 0)
          .map(async signer => {
            const address = this.getAddress(signer)
            const weight = getSignerWeight(address, metadata.config)
            const type = await getSignerType(signer)

            const enabled =
              type !== SignerType.GUARD ||
              requests.every(({ status }) => Object.values(status.signers).some(({ state }) => state === SignerState.SIGNED))

            let ready = true
            if (signer instanceof GuardSigner) {
              try {
                const guardStore = this.store.get(GuardStore)
                const { methods, active } = await guardStore.getAuthMethods()
                ready = methods.length === 0 || !active
              } catch (error) {
                console.error('unable to fetch auth methods', error)
              }
            }

            const signed = requests.every(
              ({ status: { signers } }) => address in signers && !isSignerStatusPending(signers[address])
            )

            return { address, weight, type, enabled, ready, status: signed ? 'signed' : 'unsigned' }
          })
      )

      if (!signerMetadataEqual(signerMetadata, this.signerMetadata.get())) {
        this.signerMetadata.set(signerMetadata)
      }
    })

    this.signerMetadata.subscribe(signerMetadata => {
      if (signerMetadata.length === 0) {
        this.mode.set(SigningMode.NONE)
        return
      }

      if (this.weight.get() >= this.threshold.get()) {
        this.mode.set(SigningMode.NONE)
        return
      }

      const readySigner = signerMetadata.find(({ enabled, ready, status }) => enabled && ready && status === 'unsigned')
      if (readySigner) {
        this.promptSigner(readySigner.address)
        return
      }

      const interactiveGuard = signerMetadata.find(
        ({ type, enabled, ready, status }) => type === SignerType.GUARD && enabled && !ready && status === 'unsigned'
      )
      if (interactiveGuard) {
        this.promptSigner(interactiveGuard.address)
        return
      }

      this.mode.set(SigningMode.MANAGER)
    })
  }

  reset(reason?: any) {
    const requests = this.requests.get()
    this.requests.set([])
    requests.forEach(({ reject }) => reject(reason))
    this.signWithGuard = undefined
  }

  setRecoverySigner(signer: Wallet) {
    this.signers.recoverySigner = new signers.SignerWrapper(signer)
    this.setAddress(this.signers.recoverySigner, signer.address)
  }

  removeRecoverySigner() {
    if (this.signers.recoverySigner) {
      this.signerAddresses.delete(this.signers.recoverySigner)
      this.signers.recoverySigner = undefined
    }
  }

  setSessionSigner(signer: Wallet | string) {
    const signerAddress = typeof signer === 'string' ? signer : signer.address

    if (signer instanceof Wallet) {
      this.encryptSessionKey(signer)
    }

    const encryptedSessionSigner = new EncryptedSessionSigner(signerAddress, async message => {
      const sessionKey = await this.decryptSessionKey()

      if (!sessionKey) {
        throw new Error('could not decrypt session key')
      }

      const sessionSigner = new Wallet(sessionKey)
      return sessionSigner.signMessage(message)
    })

    this.signers.sessionSigner = encryptedSessionSigner

    this.setAddress(this.signers.sessionSigner, signerAddress)
  }

  setSessionSignerAddress(address: string) {
    this.setAddress(this.signers.sessionSigner!, address)
  }

  async getSessionSigner() {
    if (this.signers.sessionSigner) {
      return this.signers.sessionSigner
    }

    // XXX: Migrate legacy session key from local storage - remove this code after transitional period (~Jan 15 2022)
    try {
      const sessionKey = this.local.sessionKey.get()

      if (sessionKey) {
        const sessionSigner = new Wallet(sessionKey)

        // Move session key to encrypted indexeddb
        await this.encryptSessionKey(sessionSigner)

        // Remove session key from local storage
        this.local.sessionKey.del()
      }
    } catch (err) {
      console.error('SignerStore: Unable to migrate legacy sessionKey.')
    }

    // Get sessionSigner from encrypted indexeddb
    try {
      const sessionKey = await this.decryptSessionKey()

      if (sessionKey) {
        const sessionSigner = new Wallet(sessionKey)

        this.setSessionSigner(sessionSigner)

        return this.signers.sessionSigner
      }
    } catch (err) {
      console.error('SignerStore: Unable to decrypt sessionKey.')
    }

    return
  }

  async decryptSessionKey() {
    const db = await getIndexedDB(IndexedDBKey.SECURITY)
    const key = await db.get(IndexedDBKey.SECURITY, 'key')
    const encrypted: Encrypted = await db.get(IndexedDBKey.SECURITY, 'sessionKey')

    if (encrypted) {
      return decrypt(key, encrypted)
    }

    return undefined
  }

  async encryptSessionKey(sessionSigner: Wallet) {
    // Create cryptoKey for encrypting sensitive data
    const key = await createKey()

    // Encrypt session signer private key
    const encrypted = await encrypt(key, sessionSigner.privateKey)
    encrypted.salt = createSaltFromAddress(sessionSigner.address)

    // Store cryptoKey and encrypted data in indexed db
    const db = await getIndexedDB(IndexedDBKey.SECURITY)
    await db.put(IndexedDBKey.SECURITY, key, 'key')
    await db.put(IndexedDBKey.SECURITY, encrypted, 'sessionKey')
  }

  private setAddress(signer: signers.SapientSigner, address: string) {
    this.signerAddresses.set(signer, address)
  }

  private getAddress(signer: signers.SapientSigner): string {
    const address = this.signerAddresses.get(signer)

    if (!address) {
      throw new Error('SignerStore: Could not find signer address')
    }

    return address
  }

  async promptSigner(signerAddress: string) {
    const signers = Object.values(this.signers) as signers.SapientSigner[]
    const signer = signers.find(signer => this.getAddress(signer) === signerAddress)

    if (!signer) {
      throw new Error('SignerStore: Could not find a signer for the given address')
    }

    const suffix = signer.suffix()

    const commitSignatures = (requests: SignRequest[], signatures: BytesLike[]) => {
      // update requests with signatures by the prompted signer
      requests.forEach(
        ({ status: { signers } }, i) => (signers[signerAddress] = { state: SignerState.SIGNED, signature: signatures[i], suffix })
      )

      // check which requests are complete
      const finished = requests.filter(request => request.callback(request.status, metadata => (request.metadata = metadata)))

      // update pending requests and remove finished ones
      // only trigger observers if something actually changed
      const thisRequests = this.requests.get()
      if (thisRequests.some(request => requests.includes(request))) {
        this.requests.set(thisRequests.filter(request => !finished.includes(request)))
      }

      // resolve all finished requests
      finished.forEach(request => {
        request.status.ended = true
        request.resolve(request.status)
      })
    }

    if (signer instanceof GuardSigner) {
      const guardStore = this.store.get(GuardStore)
      const { methods, active } = await guardStore.fetchAuthMethods()

      if (methods.includes(AuthMethod.TOTP) && active) {
        this.signWithGuard = async (totpCode?: string): Promise<void> => {
          const requests = this.requests
            .get()
            .filter(
              ({ status: { signers } }) => !(signerAddress in signers) || signers[signerAddress].state === SignerState.INITIAL
            )

          const request = requests.shift()
          if (!request) {
            return
          }

          // request one signature from the guard using the entered totp code
          const signature = await signer.sign(request.message, { ...request.metadata, guardTotpCode: totpCode })
          commitSignatures([request], [signature])

          // if the first request succeeded, then 2fa should be briefly
          // deactivated and the remaining requests should be fulfilled
          await Promise.all(
            requests.map(async request => {
              const signature = signer.sign(request.message, request.metadata)
              request.status.signers[signerAddress] = { state: SignerState.SIGNING, request: signature }
              commitSignatures([request], [await signature])
            })
          )
        }

        this.mode.set(SigningMode.GUARD_TOTP)
        return
      }
    }

    await Promise.all(
      this.requests
        .get()
        .filter(({ status: { signers } }) => !(signerAddress in signers) || signers[signerAddress].state === SignerState.INITIAL)
        .map(async request => {
          const signature = signer.sign(request.message, request.metadata)
          request.status.signers[signerAddress] = { state: SignerState.SIGNING, request: signature }
          commitSignatures([request], [await signature])
        })
    )
  }

  // SignatureOrchestrator interface -------------------------------------------
  getSigners(): Promise<string[]> {
    return Promise.all(Object.values(this.signers).map(signer => signer.getAddress()))
  }

  async signMessage(args: {
    candidates: string[]
    message: BytesLike
    metadata: object
    callback: (status: Status, onNewMetadata: (metadata: object) => void) => boolean
  }): Promise<Status> {
    const { message, metadata } = args

    if (!commons.isWalletSignRequestMetadata(metadata)) {
      throw new Error('metadata must be WalletSignRequestMetadata')
    }

    const status: Status = {
      ended: false,
      message,
      signers: {
        [this.getAddress(this.signers.guardSignerV1)]: { state: SignerState.INITIAL },
        [this.getAddress(this.signers.guardSignerV2)]: { state: SignerState.INITIAL },
        [this.getAddress(this.signers.testnetGuardSignerV1)]: { state: SignerState.INITIAL },
        ...(this.signers.sessionSigner
          ? { [this.getAddress(this.signers.sessionSigner)]: { state: SignerState.INITIAL } }
          : undefined),
        ...(this.signers.recoverySigner
          ? { [this.getAddress(this.signers.recoverySigner)]: { state: SignerState.INITIAL } }
          : undefined)
      }
    }

    const guardStore = this.store.get(GuardStore)

    await guardStore.fetchAuthMethods()

    return new Promise((resolve, reject) => this.requests.update(requests => [...requests, { ...args, status, resolve, reject }]))
  }

  buildDeployTransaction(metadata: object): Promise<commons.transaction.TransactionBundle | undefined> {
    const orchestrator = new Orchestrator(Object.values(this.signers))
    return orchestrator.buildDeployTransaction(metadata)
  }

  predecorateSignedTransactions(metadata?: object): Promise<commons.transaction.SignedTransactionBundle[]> {
    const orchestrator = new Orchestrator(Object.values(this.signers))
    return orchestrator.predecorateSignedTransactions(metadata)
  }

  decorateTransactions(
    bundle: commons.transaction.IntendedTransactionBundle,
    metadata?: object
  ): Promise<commons.transaction.IntendedTransactionBundle> {
    const orchestrator = new Orchestrator(Object.values(this.signers))
    return orchestrator.decorateTransactions(bundle, metadata)
  }

  // ----------------------------------------------------------------------------

  destroyStore() {
    this.signers.sessionSigner = undefined
  }
}

function signerMetadataEqual(a: SignerMetadata[], b: SignerMetadata[]): boolean {
  if (a.length !== b.length) {
    return false
  }

  for (const i in a) {
    if (a[i].address !== b[i].address) {
      return false
    }

    if (a[i].weight !== b[i].weight) {
      return false
    }

    if (a[i].type !== b[i].type) {
      return false
    }

    if (a[i].enabled !== b[i].enabled) {
      return false
    }

    if (a[i].ready !== b[i].ready) {
      return false
    }

    if (a[i].status !== b[i].status) {
      return false
    }
  }

  return true
}
