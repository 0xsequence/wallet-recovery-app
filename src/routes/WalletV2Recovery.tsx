import { Box } from '@0xsequence/design-system'
import { useState } from 'react'

import { useWalletV2State } from '~/hooks/use-wallet-v2-state'
import { useTransactionHandlers } from '~/hooks/use-transaction-handlers'
import { useSigningHandlers } from '~/hooks/use-signing-handlers'
import { useModalManagement } from '~/hooks/use-modal-management'

import RecoveryHeader from '~/components/header/RecoveryHeader'
import PendingIndicator from '~/components/wallet/PendingIndicator'
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
    const handleSendTokenWrapper = async (to?: string, amount?: string) => {
        if (to && amount && modals.sendTokenModal.pendingToken) {
            await handleSendToken(modals.sendTokenModal.pendingToken, to, amount)
            modals.sendTokenModal.close()
        }
    }

    const handleSendCollectibleWrapper = async (to?: string, amount?: string) => {
        if (to && amount && modals.sendCollectibleModal.pendingCollectible) {
            await handleSendCollectible(modals.sendCollectibleModal.pendingCollectible, to, amount)
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

    return (
        <Box>
            <RecoveryHeader />

            <Box flexDirection="column" alignItems="center">
                <Box
                    flexDirection="column"
                    padding="5"
                    width="full"
                    style={{ maxWidth: WALLET_WIDTH }}
                    paddingBottom="20"
                >
                    <Box flexDirection="column">
                        <WalletConnectionsSection />

                        <PendingIndicator paddingY="5" />

                        <WalletAssetsSection
                            onTokenSendClick={modals.sendTokenModal.open}
                            onCollectibleSendClick={modals.sendCollectibleModal.open}
                        />
                    </Box>
                </Box>
            </Box>

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
        </Box>
    )
}

export default WalletV2Recovery