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

export const getGatewayAddress = async () => {
  var local = new LocalStore<string>(LocalStorageKey.GATEWAY_ADDRESS)
  var gatewayAddress = local.get()

  var accessible = await fetch(`${gatewayAddress}`)
    .then(() => true)
    .catch(() => false)

  var key = 0
  while (!accessible || !gatewayAddress) {
    gatewayAddress = GATEWAYS[key++]

    accessible = await fetch(`${gatewayAddress}`)
      .then(() => true)
      .catch(() => false)

    if (key >= GATEWAYS.length) {
      return GATEWAYS[0]
    }
  }

  local.set(gatewayAddress)
  return gatewayAddress
}
