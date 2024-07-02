import { commons } from '@0xsequence/core'
import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'

import { ERC20_ABI } from '~/constants/abi'

import { EIP1193Provider } from '~/hooks/useSyncProviders'

import { observable } from '~/stores'

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

  selectedExternalProvider = observable<EIP1193Provider | undefined>(undefined)

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

    const externalProvider = this.selectedExternalProvider.get()

    if (!externalProvider) {
      console.warn('No external provider selected')
      return
    }

    externalProvider.send?.({ method: 'eth_requestAccounts', params: [] }, (error, accounts) => {
      if (error) {
        console.error(error)
      }
      if (accounts) {
        console.log('accounts', accounts)
      }
    })

    //   const response = externalProvider.send('eth_requestAccounts', []).then(async accounts => {
    //     await externalProvider.send('wallet_switchEthereumChain', [{ chainId: ethers.utils.hexValue(chainId) }])

    //     const addr = accounts[0]

    //     const status = await account.status(chainId)

    //     let txn: commons.transaction.Transactionish | undefined

    //     if (tokenBalance.contractType === ContractType.NATIVE) {
    //       txn = {
    //         to: addr,
    //         value: ethers.utils.parseEther(amount)
    //       }
    //     } else if (tokenBalance.contractType === ContractType.ERC20) {
    //       const erc20 = new ethers.Contract(tokenBalance.contractAddress, ERC20_ABI, externalProvider)
    //       txn = await erc20.populateTransaction.transfer(
    //         addr,
    //         ethers.utils.parseUnits('0', tokenBalance.contractInfo?.decimals ?? 18)
    //       )
    //     }

    //     if (!txn) {
    //       throw new Error('Could not create transaction')
    //     }

    //     // const tx = {
    //     //   from: addr,
    //     //   to: '0x08FFc248A190E700421C0aFB4135768406dCebfF',
    //     //   value: ethers.utils.parseEther('0.00001')
    //     // }
    //     // signer.sendTransaction(tx).then(transaction => {
    //     //   console.dir(transaction)
    //     //   alert('Send finished!')
    //     // })

    //     const predecorated = await account.predecorateTransactions(txn, status, chainId)
    //     const signed = await account.signTransactions(predecorated, chainId, undefined, { serial: true })
    //     const decorated = await account.decorateTransactions(signed, status)
    //     const unwound = commons.transaction.unwind(account.address, decorated.transactions)

    //     // const hash = await externalProvider.send('eth_sendTransaction', [
    //     //   {
    //     //     from: addr,
    //     //     to: decorated.entrypoint,
    //     //     data: commons.transaction.encodeBundleExecData(decorated),
    //     //     gasLimit: 1000000 // TODO
    //     //   }
    //     // ])

    //     const hash = await window.ethereum.request({
    //       method: 'eth_sendTransaction',
    //       params: [
    //         {
    //           from: addr,
    //           to: decorated.entrypoint,
    //           data: commons.transaction.encodeBundleExecData(decorated)
    //         }
    //       ]
    //     })

    //     console.log('transactionHash', hash)

    //     // let response: ethers.providers.TransactionResponse
    //     // do {
    //     //   response = await externalProvider.getTransaction(hash)
    //     //   await response.wait()
    //     // } while (!response.blockNumber)
    //     // return response
    //   })
    // }
  }
}
