import { LocalStorageKey } from '~/constants/storage'

import { LocalStore } from '~/stores/LocalStore'

const GATEWAYS = [
  'https://flk-ipfs.io/ipfs/',
  'https://ipfs.cyou/ipfs/',
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

export class IPFSGatewayHelper {
  private gatewayURL: string

  constructor() {
    this.gatewayURL = GATEWAYS[0]
    this.findAccessibleGateway()
  }

  private findAccessibleGateway() {
    for (const url of GATEWAYS) {
      fetch(url)
        .then(() => {
          this.gatewayURL = url
          return
        })
        .catch(() => {})
    }
    console.warn('No accessible IPFS gateway found')
  }

  async fetch(uri: string): Promise<Response> {
    if (uri.startsWith('ipfs://')) {
      uri = uri.replace('ipfs://', this.gatewayURL)
      return fetch(uri)
    } else {
      throw new Error('Invalid IPFS URI')
    }
  }

  getGatewayURL(uri: string): string {
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', this.gatewayURL)
    } else {
      throw new Error('Invalid IPFS URI')
    }
  }
}
