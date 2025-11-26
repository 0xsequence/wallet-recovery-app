import { Sequence } from '@0xsequence/wallet-wdk'
import { Address } from 'ox'
import { createContext, useContext, useState } from 'react'

import { useAwaitMnemonic } from '~/hooks/use-await-mnemonic'
import { useExternalWallet } from '~/hooks/use-external-wallet'
import { useFetchQueuedPayloads } from '~/hooks/use-fetch-queued-payloads'
import { useHandleQueuePayload } from '~/hooks/use-handle-queue-payload'

// const TEST_TARGET_CHAIN_ID = 137 //42161
// const TEST_DESTINATION_ADDRESS = '0xb56E68Bfcf343AD57af58f93b4Ede11AB60162B5'

export const WalletRecoveryContext = createContext<RecoveryContextProps | null>(null)

export function useCreateWalletRecoveryContext() {
  const [walletAddress, setWalletAddress] = useState<Address.Address>()
  const [destinationAddress, setDestinationAddress] = useState<Address.Address | ''>('')
  const [mnemonic, setMnemonic] = useState('')
  const [chainId, setChainId] = useState(0)
  const [walletSigner, setWalletSigner] = useState<Sequence.RecoverySigner>()
  const {
    providers,
    provider,
    setProvider,
    recoveryPayload,
    setRecoveryPayload,
    sendRecoveryPayload,
    getWalletAddresses
  } = useExternalWallet()
  const [transactionId, setTransactionId] = useState<any>()
  const payloads = useFetchQueuedPayloads(walletAddress)

  const set = {
    walletAddress: setWalletAddress,
    walletSigner: setWalletSigner,
    mnemonic: setMnemonic,
    chainId: setChainId,
    recoveryPayload: setRecoveryPayload,
    transactionId: setTransactionId,
    destinationAddress: setDestinationAddress,
    provider: setProvider
  }

  const values = {
    walletAddress,
    walletSigner,
    mnemonic,
    chainId,
    recoveryPayload,
    transactionId,
    destinationAddress,
    payloads,
    providers,
    provider
  }

  const awaitedMnemonic = useAwaitMnemonic()
  const queuePayload = useHandleQueuePayload({
    values,
    awaitedMnemonic,
    sendRecoveryPayload
  })

  const handle = {
    awaitedMnemonic,
    queuePayload,
    sendRecoveryPayload,
    getWalletAddresses
  }

  return { values, set, handle }
}

export function useWalletRecovery() {
  const context = useContext(WalletRecoveryContext)
  if (!context) throw new Error('useWalletRecovery must be used inside a WalletRecoveryContext Provider')
  return context
}

export type RecoveryContextProps = ReturnType<typeof useCreateWalletRecoveryContext>

export type WalletRecoveryProviderProps = {
  value: RecoveryContextProps
  children: React.ReactNode
}
