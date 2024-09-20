import { JsonRpcRequest } from '@0xsequence/network'
import SignClient from '@walletconnect/sign-client'
import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import { ethers } from 'ethers'

import { WALLET_CONNECT_PROJECT_ID } from '~/constants/wallet-context'

import { AuthStore } from './AuthStore'
import { NetworkStore } from './NetworkStore'
import { WalletStore } from './WalletStore'
import { Store, observable, useObservable, useStore } from './index'

export class WalletConnectSignClientStore {
  authStore = useStore(AuthStore)
  accountAddress = useObservable(this.authStore.accountAddress)
  isReady = observable(false)

  private signClient?: SignClient
  private currentRequestInfo?: { id: number; topic: string }
  private _sessions = observable<SessionTypes.Struct[]>([])

  sessions = this._sessions.readOnly()

  constructor(private store: Store) {
    this.createSignClient()
  }

  private createSignClient = async () => {
    this.signClient = await SignClient.init({
      projectId: WALLET_CONNECT_PROJECT_ID,
      // optional parameters
      //relayUrl: '<YOUR RELAY URL>',
      metadata: {
        name: 'Sequence Recovery Wallet',
        description: 'Sequence Recovery Wallet - Recover Your Wallet',
        // TODO replace url with recovery wallet url
        url: 'http://localhost:5173',
        icons: ['https://sequence.app/apple-touch-icon.png']
      }
    })

    this.signClient.on('session_proposal', this.onSessionProposal)
    this.signClient.on('session_request', this.onSessionRequest)
    this.signClient.on('session_ping', this.onSessionPing)
    this.signClient.on('session_event', this.onSessionEvent)
    this.signClient.on('session_update', this.onSessionUpdate)
    this.signClient.on('session_delete', this.onSessionDelete)

    this._sessions.set(this.signClient?.session.getAll() ?? [])

    this.isReady.set(true)
  }

  pair = async (uri: string) => {
    if (!this.signClient) {
      throw new Error('WalletConnect signClient not initialized.')
    }

    await this.signClient.core.pairing.pair({ uri })
  }

  rejectRequest = () => {
    // From error codes in walletconnect documentation
    if (this.currentRequestInfo) {
      this.signClient?.respond({
        topic: this.currentRequestInfo.topic,
        response: {
          id: this.currentRequestInfo.id,
          jsonrpc: '2.0',
          error: {
            message: 'User rejected.',
            code: 4001
          }
        }
      })
    }
  }

  disconnectSession = async (topic: string) => {
    const session = this.signClient?.session.get(topic)

    if (session) {
      await this.signClient?.engine.client.disconnect({
        topic: session.topic,
        reason: {
          message: 'User disconnected.',
          code: 6000
        }
      })

      this._sessions.set(this.signClient?.session.getAll() ?? [])
    }
  }

  disconnectAllSessions = async () => {
    const sessions = this.signClient?.session.getAll() ?? []
    sessions.forEach(async session => {
      await this.signClient?.engine.client.disconnect({
        topic: session.topic,
        reason: {
          message: 'User disconnected.',
          code: 6000
        }
      })
    })

    this._sessions.set([])
  }

  onSessionProposal = async (ev: SignClientTypes.EventArguments['session_proposal']) => {
    console.log('onSessionProposal', ev)

    const requiredNamespaces = ev.params.requiredNamespaces
    const optionalNamespaces = ev.params.optionalNamespaces

    const chainsInRequiredNamespaces =
      Object.keys(requiredNamespaces).length === 0 ? [] : requiredNamespaces.eip155.chains ?? []
    const chainsInOptionalNamespaces =
      Object.keys(optionalNamespaces).length === 0 ? [] : optionalNamespaces.eip155.chains ?? []

    const chainId =
      chainsInRequiredNamespaces[0]?.split(':').pop() ?? chainsInOptionalNamespaces[0]?.split(':').pop()

    if (!chainId) {
      throw new Error('No chainId found in WalletConnect session proposal namespaces.')
    }

    const connectOptions = {
      app: ev.params.proposer.metadata.name,
      origin: ev.params.proposer.metadata.url,
      networkId: chainId,
      keepWalletOpened: true
    }

    const connectDetails = await this.store
      .get(WalletStore)
      .walletRequestHandler.promptConnect(connectOptions)

    if (connectDetails && connectDetails.connected) {
      const networkStore = this.store.get(NetworkStore)

      // if (chainId) {
      //   networkStore.setDefaultNetwork(chainId)
      // }

      const chains = networkStore.networks.get()
      const requestedChains = chainsInRequiredNamespaces.map(chain => Number(chain.split(':').pop()))
      const optionalChains = chainsInOptionalNamespaces.map(chain => Number(chain.split(':').pop()))
      const filteredChainsForRequested = chains
        .map(chain => chain.chainId)
        .filter(chain => [...requestedChains, ...optionalChains].includes(chain))

      const accounts = filteredChainsForRequested.map(chain => 'eip155:' + chain + ':' + this.accountAddress)

      const namespaces = {
        eip155: {
          accounts,
          methods: [
            'eth_sendTransaction',
            'eth_sendRawTransaction',
            'eth_signTransaction',
            'eth_sign',
            'personal_sign',
            'eth_signTypedData',
            'eth_signTypedData_v4',
            'wallet_switchEthereumChain'
          ],
          events: ['chainChanged', 'accountsChanged', 'connect', 'disconnect']
        }
      }
      const result = await this.signClient?.approve({
        id: ev.id,
        namespaces
      })

      const session = await result?.acknowledged()

      console.log('session', session)

      this._sessions.set(this.signClient?.session.getAll() ?? [])

      this.signClient?.core.pairing
        .getPairings()
        .filter(pairing => ev.params.pairingTopic !== pairing.topic)
        .forEach(async pairing => {
          if (ev.params.proposer.metadata.url === pairing.peerMetadata?.url) {
            await this.signClient?.core.pairing.disconnect({
              topic: pairing.topic
            })
          }
        })
    } else {
      // User rejected connection
      this.signClient?.reject({
        id: ev.id,
        reason: {
          message: 'User rejected.',
          code: 5000
        }
      })
    }
  }

  onSessionRequest = async (ev: SignClientTypes.EventArguments['session_request']) => {
    console.log('onSessionRequest', ev)

    const chainId = ev.params.chainId.split(':').pop()
    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: ev.id,
      method: ev.params.request.method,
      params: ev.params.request.params,
      chainId: Number(chainId)
    }

    // strip nonces from WalletConnect eth_sendTransaction requests
    // some dapps set nonces using eth_getTransactionCount, which doesn't work with sequence wallets
    // e.g. https://staking.polygon.technology
    if (payload.method === 'eth_sendTransaction') {
      if (Array.isArray(payload.params)) {
        payload.params.forEach((transaction: ethers.TransactionRequest) => {
          delete transaction.nonce
        })
      }
    }

    const session = this.signClient?.session.get(ev.topic)

    const connectOptions = {
      app: session?.peer.metadata.name ?? '',
      origin: session?.peer.metadata.url,
      networkId: chainId
    }

    this.store.get(WalletStore).walletRequestHandler.setConnectOptions(connectOptions)

    this.currentRequestInfo = { topic: ev.topic, id: ev.id }

    try {
      const result = await this.store.get(WalletStore).walletRequestHandler.request(payload)
      this.signClient?.respond({
        topic: ev.topic,
        response: {
          id: ev.id,
          jsonrpc: '2.0',
          result
        }
      })
    } catch (err) {
      this.signClient?.respond({
        topic: ev.topic,
        response: {
          id: ev.id,
          jsonrpc: '2.0',
          error: {
            message: err.message,
            code: err.code ?? 4001
          }
        }
      })
    }

    this.currentRequestInfo = undefined
  }

  onSessionPing = async (ev: SignClientTypes.EventArguments['session_ping']) => {
    console.log('onSessionPing', ev)
  }

  onSessionEvent = async (ev: SignClientTypes.EventArguments['session_event']) => {
    console.log('onSessionEvent', ev)
  }

  onSessionUpdate = async (ev: SignClientTypes.EventArguments['session_update']) => {
    console.log('onSessionUpdate', ev)
  }

  onSessionDelete = async (ev: SignClientTypes.EventArguments['session_delete']) => {
    console.log('onSessionDelete', ev)
    this._sessions.set(this.signClient?.session.getAll() ?? [])
  }
}
