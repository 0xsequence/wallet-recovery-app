import { useEffect, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { useWalletV2State } from '~/hooks/use-wallet-v2-state'
import { useTransactionHandlers } from '~/hooks/use-transaction-handlers'
import { useSigningHandlers } from '~/hooks/use-signing-handlers'
import { useModalManagement } from '~/hooks/use-modal-management'

import RecoveryHeader from '~/components/header/RecoveryHeader'
import { WalletConnectionsSection } from '~/components/wallet/sections/WalletConnectionsSection'
import { WalletAssetsSection } from '~/components/wallet/sections/WalletAssetsSection'
import { NetworkModal } from '~/components/wallet/modals/NetworkModal'
import { SendTokenModal } from '~/components/wallet/modals/SendTokenModal'
import { SendCollectibleModal } from '~/components/wallet/modals/SendCollectibleModal'
import { SignTransactionModal } from '~/components/wallet/modals/SignTransactionModal'
import { SignMessageModal } from '~/components/wallet/modals/SignMessageModal'
import { useExternalProviderSync } from '~/hooks/use-external-provider-sync'

export const WALLET_WIDTH = 800

function WalletV2Recovery() {
    const authStore = useStore(AuthStore)
    const isLoadingAccountObservable = useObservable(authStore.isLoadingAccount)
    const hasAccount = useObservable(authStore.accountAddress)

    const [isLoadingAccount, setIsLoadingAccount] = useState(false)

    useEffect(() => {
        setIsLoadingAccount(isLoadingAccountObservable)
    }, [isLoadingAccountObservable])

    // Consolidate all store subscriptions and state
    const { stores, state } = useWalletV2State()
    const { walletStore, networkStore, tokenStore } = stores

    // Sync external providers
    useExternalProviderSync()

    // Modal management
    const modals = useModalManagement(walletStore, state.isNetworkModalOpen)

    // Transaction handlers
    const { handleSendToken, handleSendCollectible, handlePendingSignTransaction } = useTransactionHandlers(
        walletStore,
        tokenStore,
        networkStore
    )

    // Signing handlers
    const { handleSignTransaction, handleSignMessage, cancelRequest } = useSigningHandlers(
        stores.authStore,
        walletStore,
        stores.walletConnectSignClientStore,
        handlePendingSignTransaction
    )

    // Track dismissible state for send modals
    const [isSendTokenDismissible, setIsSendTokenDismissible] = useState(true)
    const [isSendCollectibleDismissible, setIsSendCollectibleDismissible] = useState(true)

    // Wrapper handlers for send modals
    const handleSendTokenWrapper = async (props: { to?: string, amount?: string }) => {
        if (props.to && props.amount && modals.sendTokenModal.pendingToken) {
            await handleSendToken(modals.sendTokenModal.pendingToken, props.to, props.amount)
            modals.sendTokenModal.close()
        }
    }

    const handleSendCollectibleWrapper = async (props: { to?: string, amount?: string }) => {
        if (props.to && props.amount && modals.sendCollectibleModal.pendingCollectible) {
            await handleSendCollectible(modals.sendCollectibleModal.pendingCollectible, props.to, props.amount)
            modals.sendCollectibleModal.close()
        }
    }

    // Handler for sign message modal
    const handleSignMessageClose = (details?: any) => {
        if (!details) {
            cancelRequest()
        } else {
            handleSignMessage(details)
        }
    }

    // If no account and not loading, redirect would happen via route guard
    if (!hasAccount && !isLoadingAccount) {
        return null
    }

    return (
        <div>
            <RecoveryHeader />

            <div className='flex flex-col items-center'>
                <div className='flex flex-col p-5 w-full pb-20' style={{ maxWidth: WALLET_WIDTH }} >
                    <div className='flex flex-col'>
                        <WalletConnectionsSection />

                        <WalletAssetsSection
                            onTokenSendClick={modals.sendTokenModal.open}
                            onCollectibleSendClick={modals.sendCollectibleModal.open}
                        />
                    </div>
                </div>
            </div>

            <NetworkModal
                isOpen={modals.networkModal.isOpen}
                onClose={modals.networkModal.close}
                networkStore={networkStore}
                walletStore={walletStore}
            />

            <SignTransactionModal
                isOpen={state.isSigningTxn}
                onCancel={cancelRequest}
                onSign={handleSignTransaction}
            />

            <SignMessageModal
                isOpen={state.isSigningMsg}
                onClose={handleSignMessageClose}
            />

            <SendTokenModal
                isOpen={modals.sendTokenModal.isOpen}
                isDismissible={isSendTokenDismissible}
                tokenBalance={modals.sendTokenModal.pendingToken}
                onClose={modals.sendTokenModal.close}
                onRecover={handleSendTokenWrapper}
                onDismissibleChange={setIsSendTokenDismissible}
            />

            <SendCollectibleModal
                isOpen={modals.sendCollectibleModal.isOpen}
                isDismissible={isSendCollectibleDismissible}
                collectibleInfo={modals.sendCollectibleModal.pendingCollectible}
                onClose={modals.sendCollectibleModal.close}
                onRecover={handleSendCollectibleWrapper}
                onDismissibleChange={setIsSendCollectibleDismissible}
            />
        </div>
    )
}

export default WalletV2Recovery