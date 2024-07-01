import { commons } from '@0xsequence/core'
import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'

import { ERC20_ABI } from '~/constants/abi'

import { Store } from '.'
import { AuthStore } from './AuthStore'
import { NetworkStore } from './NetworkStore'

declare global {
  interface Window {
    ethereum: any
    sequence: any
    walletRouter: any
  }
}

export class WalletStore {
  constructor(private store: Store) {}

  sendERC20Transaction = async (tokenBalance: TokenBalance, amount: string) => {
    const account = this.store.get(AuthStore).account
    const chainId = tokenBalance.chainId

    if (!account) {
      throw new Error('No account found')
    }

    const networkForToken = this.store
      .get(NetworkStore)
      .networks.get()
      .find(network => network.chainId === chainId)

    if (!networkForToken) {
      console.warn(`No network found for chainId ${chainId}`)
      return
    }

    if (!networkForToken.rpcUrl) {
      console.warn(`No RPC URL found for network ${networkForToken.name}`)
      return
    }

    const provider = new ethers.providers.JsonRpcProvider(networkForToken.rpcUrl)
    const windowProvider = new ethers.providers.Web3Provider(window.ethereum, chainId)

    const response = windowProvider.send('eth_requestAccounts', []).then(async accounts => {
      await windowProvider.send('wallet_switchEthereumChain', [{ chainId: ethers.utils.hexValue(chainId) }])

      const addr = accounts[0]

      const status = await account.status(chainId)

      let txn: commons.transaction.Transactionish | undefined

      if (tokenBalance.contractType === ContractType.NATIVE) {
        txn = {
          to: addr,
          value: ethers.utils.parseEther(amount)
        }
      } else if (tokenBalance.contractType === ContractType.ERC20) {
        const erc20 = new ethers.Contract(tokenBalance.contractAddress, ERC20_ABI, windowProvider)
        txn = await erc20.populateTransaction.transfer(
          addr,
          ethers.utils.parseUnits('0', tokenBalance.contractInfo?.decimals ?? 18)
        )
      }

      if (!txn) {
        throw new Error('Could not create transaction')
      }

      const signer = windowProvider.getSigner()

      // const tx = {
      //   from: addr,
      //   to: '0x08FFc248A190E700421C0aFB4135768406dCebfF',
      //   value: ethers.utils.parseEther('0.00001')
      // }
      // signer.sendTransaction(tx).then(transaction => {
      //   console.dir(transaction)
      //   alert('Send finished!')
      // })

      const predecorated = await account.predecorateTransactions(txn, status, chainId)
      const signed = await account.signTransactions(predecorated, chainId, undefined, { serial: true })
      const decorated = await account.decorateTransactions(signed, status)
      const unwound = commons.transaction.unwind(account.address, decorated.transactions)

      // const hash = await windowProvider.send('eth_sendTransaction', [
      //   {
      //     from: addr,
      //     to: decorated.entrypoint,
      //     data: commons.transaction.encodeBundleExecData(decorated),
      //     gasLimit: 1000000 // TODO
      //   }
      // ])

      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: addr,
            to: decorated.entrypoint,
            data: commons.transaction.encodeBundleExecData(decorated)
          }
        ]
      })

      console.log('transactionHash', hash)

      // let response: ethers.providers.TransactionResponse
      // do {
      //   response = await windowProvider.getTransaction(hash)
      //   await response.wait()
      // } while (!response.blockNumber)
      // return response
    })
  }
}
