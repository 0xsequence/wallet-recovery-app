import { AccountSignerOptions } from '@0xsequence/account/dist/declarations/src/signer'
import { commons } from '@0xsequence/core'
import { Box, Button, Divider, Text } from '@0xsequence/design-system'
import { ConnectOptions, MessageToSign } from '@0xsequence/provider'
import { useEffect, useState } from 'react'

import { useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'
import { WalletStore } from '~/stores/WalletStore'

export default function SignRequest({ onClose, isTxn }: { onClose: () => void; isTxn: boolean }) {
  const walletStore = useStore(WalletStore)
  const authStore = useStore(AuthStore)
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  const provider = walletStore.selectedExternalProvider.get()?.provider
  const account = authStore.account

  useEffect(() => {
    if (!provider) {
      throw new Error('No external provider selected')
    } else if (!account) {
      throw new Error('No account found')
    }
  }, [])

  const [isPending, setPending] = useState(false)

  const signTransaction = async (
    txn: commons.transaction.Transactionish,
    chainId?: number,
    options?: ConnectOptions
  ): Promise<{ hash: string }> => {
    // TODO do we need options?
    try {
      const providerAddress = await walletStore.getExternalProviderAddress(provider!)
      if (!providerAddress) {
        throw new Error('No provider address found')
      }

      console.log('sendTransaction chainId', chainId)

      const response = await walletStore.sendTransaction(account!, provider!, providerAddress, txn, chainId!)

      return response
    } catch (error) {
      throw error
    }
  }

  const signMessage = async (
    msg: MessageToSign,
    options?: AccountSignerOptions
  ): Promise<{ hash: string }> => {
    // TODO do we need options?
    try {
      let hash: string | undefined

      if (msg.message) {
        console.log('signMessage chainId', msg.chainId)
        hash = await account!.signMessage(msg.message, msg.chainId!, msg.eip6492 ? 'eip6492' : 'throw')
      } else if (msg.typedData) {
        const typedData = msg.typedData
        hash = await account!.signTypedData(
          typedData.domain,
          typedData.types,
          typedData.message,
          msg.chainId!,
          msg.eip6492 ? 'eip6492' : 'throw'
        )
      }

      if (!hash) {
        throw new Error('Account sign method failed')
      }

      return { hash }
    } catch (error) {
      throw error
    }
  }

  const cancelRequest = () => {
    walletStore.resetSignObservables()
    walletConnectSignClientStore.rejectRequest()
    walletStore.toSignPermission.set('cancelled')
  }

  const handleSign = async () => {
    try {
      setPending(true)

      let details: any

      if (isTxn) details = walletStore.toSignTxnDetails.get()
      else details = walletStore.toSignMsgDetails.get()

      if (!details) {
        cancelRequest()
      } else {
        const result = isTxn
          ? await signTransaction(details.txn, details.chainId, details.options)
          : await signMessage(details.message)
        walletStore.toSignResult.set(result)
        walletStore.toSignPermission.set('approved')
      }

      setPending(false)
      onClose()
    } catch (error) {
      setPending(false)
      cancelRequest()
      onClose()
      throw error
    }
  }

  const handleCancel = () => {
    setPending(false)
    cancelRequest()

    onClose()
  }
  return (
    <Box>
      <Box flexDirection="column" padding="10" alignItems="center">
        <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
          {isTxn ? 'Would you like to approve this transaction?' : 'Would you like to sign this message?'}
        </Text>
        <Divider color="gradientPrimary" width="full" height="px" />
        <Text variant="md" color="text100" paddingY="5" paddingBottom="1">
          {isTxn ? 'TRANSACTION_INFO_HERE' : 'MESSAGE_INFO_HERE'}
        </Text>
        <Box flexDirection={{ sm: 'column', md: 'row' }} gap="2" width="full" marginTop="10">
          <Button width="full" label={`Cancel`} onClick={handleCancel} data-id="signingCancel" />

          <Button
            width="full"
            variant="primary"
            label={'Send'}
            disabled={isPending}
            onClick={handleSign}
            data-id="signingContinue"
          />
        </Box>
      </Box>
    </Box>
  )
}
