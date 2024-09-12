import { LocalStorageKey } from '~/constants/storage'

import { LocalStore } from '~/stores/LocalStore'

const GATEWAYS = [
  'https://flk-ipfs.io/ipfs/',
  'https://storry.tv/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://hardbin.com/ipfs/',
  'https://ipfs.runfission.com/ipfs/',
  'https://ipfs.eth.aragon.network/ipfs/',
  'https://nftstorage.link/ipfs/',
  'https://4everland.io/ipfs/',
  'https://w3s.link/ipfs/',
  'https://trustless-gateway.link/ipfs/'
]

const TEST_HASH = 'QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1'

export class IPFSGatewayHelper {
  private gatewayURL?: string
  private localStore: LocalStore<string>

  constructor() {
    this.localStore = new LocalStore<string>(LocalStorageKey.GATEWAY_ADDRESS)
    this.gatewayURL = this.localStore.get()
    this.findAccessibleGateway()
  }

  private async findAccessibleGateway(): Promise<void> {
    const storedGateway = this.localStore.get()
    if (storedGateway && (await this.isGatewayAccessible(storedGateway))) {
      this.gatewayURL = storedGateway
      return
    }

    for (const gateway of GATEWAYS) {
      if (await this.isGatewayAccessible(gateway)) {
        this.gatewayURL = gateway
        this.localStore.set(gateway)
        return
      }
    }

    this.gatewayURL = GATEWAYS[0] // Fallback to the first gateway if none are accessible
    console.warn('No accessible IPFS gateways found, falling back to default')
  }

  private async isGatewayAccessible(gateway: string): Promise<boolean> {
    try {
      await fetch(`${gateway}${TEST_HASH}`)
      return true
    } catch {
      return false
    }
  }

  async fetch(uri: string): Promise<Response> {
    if (!this.gatewayURL) {
      await this.findAccessibleGateway()
    }
    const gatewayUri = await this.getGatewayURL(uri)
    return fetch(gatewayUri)
  }

  async getGatewayURL(uri: string): Promise<string> {
    if (!this.gatewayURL) {
      await this.findAccessibleGateway()
    }
    if (!uri.startsWith('ipfs://')) {
      throw new Error('Invalid IPFS URI')
    }
    return uri.replace('ipfs://', this.gatewayURL!)
  }
}
