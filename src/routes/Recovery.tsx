import {
    Button,
    ChevronLeftIcon,
    IconButton,
    Modal,
    Spinner,
    Text,
    TextInput,
    useMediaQuery
} from '@0xsequence/design-system'
import { ethers } from 'ethers'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { WalletStore } from '~/stores/WalletStore'
import { NetworkStore } from '~/stores/NetworkStore'

import { Account } from '@0xsequence/account'
import { universal } from '@0xsequence/core'
import { ChainId } from '@0xsequence/network'
import { Orchestrator } from '@0xsequence/signhub'
import { TRACKER } from '~/utils/tracker'
import { SEQUENCE_CONTEXT } from '~/constants/wallet-context'
import { WALLETS } from '~/constants/wallets'

import RecoveryHeader from '~/components/header/RecoveryHeader'
import Networks from '~/components/network/Networks'
import WalletList from '~/components/recovery/WalletList'
import { MnemonicInputGrid } from '~/components/mnemonic/MnemonicInputGrid'

import { WALLET_WIDTH } from './WalletV3Recovery'
import { useFindWalletViaSigner } from '~/hooks/use-find-wallet-via-signer'
import { useValidateSigner } from '~/hooks/use-validate-signer'

const MIN_PASSWORD_LENGTH = 8

const validateMnemonic = (mnemonic: string): boolean => {
    const wordCount = mnemonic.trim().split(/\s+/g).length
    return wordCount === 12 || wordCount === 24
}

const validatePassword = (password: string): boolean => {
    // Password is optional - if provided, must meet minimum length
    return password.length === 0 || password.length >= MIN_PASSWORD_LENGTH
}

const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword
}

interface FormState {
    mnemonic: string
    password: string
    confirmPassword: string
    selectedWallet: string
}

interface LoadingState {
    isSearchingWallets: boolean
    isRecovering: boolean
}

function Recovery() {
    const isMobile = useMediaQuery('isMobile')

    const authStore = useStore(AuthStore)
    const walletStore = useStore(WalletStore)
    const networkStore = useStore(NetworkStore)
    const networks = networkStore.networks.get()

    const [formState, setFormState] = useState<FormState>({
        mnemonic: '',
        password: '',
        confirmPassword: '',
        selectedWallet: ''
    })

    const navigate = useNavigate()

    // Discovery state
    const [possibleWallets, setPossibleWallets] = useState<string[]>([])
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [loadingState, setLoadingState] = useState<LoadingState>({
        isSearchingWallets: false,
        isRecovering: false
    })

    const isNetworkModalOpen = useObservable(walletStore.isNetworkModalOpen)
    const findWallets = useFindWalletViaSigner()
    const validateSigner = useValidateSigner()

    const validation = useMemo(() => {
        const isMnemonicValid = validateMnemonic(formState.mnemonic)
        const isPasswordValid = validatePassword(formState.password)
        const doPasswordsMatch = validatePasswordMatch(formState.password, formState.confirmPassword)
        const isWalletSelected = ethers.isAddress(formState.selectedWallet)
        const hasPassword = formState.password.length > 0

        return {
            isMnemonicValid,
            isPasswordValid,
            doPasswordsMatch,
            isWalletSelected,
            isFormValid: isMnemonicValid && isPasswordValid && doPasswordsMatch && isWalletSelected,
            showMnemonicError: formState.mnemonic && !isMnemonicValid,
            showPasswordError: hasPassword && !isPasswordValid,
            showPasswordMismatchError: hasPassword && formState.confirmPassword && !doPasswordsMatch
        }
    }, [formState])

    const mnemonicWordCount = useMemo(() => {
        const wordCount = formState.mnemonic.trim().split(/\s+/g).filter(w => w).length
        if (wordCount === 12) { return 12 }
        if (wordCount === 24) { return 24 }
        return 12 // default
    }, [formState.mnemonic])

    const updateFormField = useCallback(<K extends keyof FormState>(
        field: K,
        value: FormState[K]
    ) => {
        setFormState(prev => ({ ...prev, [field]: value }))
        setErrorMessage(null)
    }, [])

    const searchForWalletsFromMnemonic = useCallback(async (mnemonic: string) => {
        const wordCount = mnemonic.trim().split(/\s+/g).length
        if (wordCount !== 12 && wordCount !== 24) {
            setPossibleWallets([])
            return
        }

        setLoadingState(prev => ({ ...prev, isSearchingWallets: true }))
        setErrorMessage(null)

        try {
            if (wordCount === 12) {
                // V2 Logic
                const signer = ethers.Wallet.fromPhrase(mnemonic.trim())
                const wallets = [
                    ...(await TRACKER.walletsOfSigner({ signer: signer.address })).map(({ wallet }) => wallet),
                    ...(WALLETS[signer.address] ?? []).map(({ wallet }) => wallet)
                ]

                setPossibleWallets(wallets)
                if (wallets.length > 0) {
                    setFormState(prev => ({ ...prev, selectedWallet: wallets[0] }))
                } else {
                    setErrorMessage('No wallet match found. Please double-check your recovery phrase.')
                }
            } else {
                // V3 Logic
                const recovery = await findWallets(mnemonic)

                if (!recovery) {
                    setErrorMessage('No wallet match found. Please double-check your recovery phrase.')
                    setPossibleWallets([])
                    return
                }

                const { walletAddress } = recovery
                setPossibleWallets([walletAddress])
                setFormState(prev => ({ ...prev, selectedWallet: walletAddress }))
            }
        } catch (error) {
            console.error('Error searching for wallets:', error)
            setErrorMessage('Failed to search for wallets. Please try again.')
            setPossibleWallets([])
        } finally {
            setLoadingState(prev => ({ ...prev, isSearchingWallets: false }))
        }
    }, [findWallets])

    const handleMnemonicChange = useCallback((value: string) => {
        updateFormField('mnemonic', value)
        setPossibleWallets([])
        updateFormField('selectedWallet', '')
    }, [updateFormField])

    useEffect(() => {
        if (validateMnemonic(formState.mnemonic)) {
            searchForWalletsFromMnemonic(formState.mnemonic)
        }
    }, [formState.mnemonic])

    const handleRecoverWallet = useCallback(async () => {
        if (!validation.isFormValid) {
            return
        }

        setLoadingState(prev => ({ ...prev, isRecovering: true }))
        setErrorMessage(null)

        const wordCount = formState.mnemonic.trim().split(/\s+/g).length

        try {
            if (wordCount === 12) {
                // V2 Logic
                const recoverySigner = ethers.Wallet.fromPhrase(formState.mnemonic.trim())
                const orchestrator = new Orchestrator([recoverySigner])
                const accountToCheck = new Account({
                    address: formState.selectedWallet,
                    tracker: TRACKER,
                    contexts: SEQUENCE_CONTEXT,
                    orchestrator: orchestrator,
                    networks: networks
                })

                const accountStatus = await accountToCheck.status(ChainId.MAINNET)
                const accountConfig = accountStatus.config
                const coder = universal.genericCoderFor(accountConfig.version)
                const signers = coder.config.signersOf(accountConfig)

                const match = signers.some(signer => signer.address === recoverySigner.address)

                if (!match) {
                    setErrorMessage('No wallet match found. Please double-check your recovery phrase and wallet address.')
                    return
                }

                await authStore.signInWithRecoveryMnemonic(
                    formState.selectedWallet,
                    formState.mnemonic.trim(),
                    formState.password
                )
                navigate('/wallet-v2-recovery')

            } else {
                // V3 Logic
                const recovery = await findWallets(formState.mnemonic)

                if (!recovery) {
                    setErrorMessage('No wallet match found. Please double-check your recovery phrase and wallet address.')
                    return
                }

                const { walletAddress, recoverySignerAddress } = recovery

                await validateSigner(walletAddress, recoverySignerAddress, formState.mnemonic.trim())
                await authStore.signInWithRecoveryMnemonic(
                    walletAddress,
                    formState.mnemonic.trim(),
                    formState.password
                )
                navigate('/wallet-v3-recovery')
            }
        } catch (error) {
            console.error('Recovery error:', error)
            setErrorMessage('Failed to recover wallet. Please verify your recovery phrase and try again.')
        } finally {
            setLoadingState(prev => ({ ...prev, isRecovering: false }))
        }
    }, [
        validation.isFormValid,
        formState.mnemonic,
        formState.password,
        formState.selectedWallet,
        findWallets,
        validateSigner,
        authStore,
        networks
    ])

    const isAnyLoading = loadingState.isSearchingWallets || loadingState.isRecovering

    return (
        <div className='flex flex-col bg-background-primary pb-20'>
            <RecoveryHeader />

            <div className='self-center flex flex-col gap-4 p-4 w-full' style={{ maxWidth: WALLET_WIDTH }}>

                <div className='flex flex-col'>
                    <div className='flex flex-row items-center gap-2'>
                        <IconButton
                            size="sm"
                            shape="circle"
                            onClick={() => navigate('/')}
                            icon={ChevronLeftIcon}
                        />

                        <Text variant="xlarge" color="text80">
                            Recover your wallet
                        </Text>
                    </div>


                    <div className='h-0.5 w-full bg-backgroundMuted my-6' />

                    <Text variant="normal" fontWeight="medium" color="text80" className='mb-2'>
                        Recovery phrase
                    </Text>

                    <Text variant="normal" fontWeight="medium" color="text50" className='mb-3'>
                        Enter your 12 or 24-word mnemonic phrase below.
                    </Text>

                    <MnemonicInputGrid
                        wordCount={mnemonicWordCount}
                        onMnemonicChange={handleMnemonicChange}
                    />

                    {validation.showMnemonicError && (
                        <Text variant="small" color="negative" className='ml-1 mt-2'>
                            Mnemonic must be 12 or 24 words
                        </Text>
                    )}
                </div>

                <div className='flex flex-col'>
                    <Text variant="normal" fontWeight="medium" color="text80">
                        Create password (optional)
                    </Text>
                    <Text variant="normal" fontWeight="medium" color="text50" className='mb-1'>
                        Optionally encrypt your mnemonic with a {MIN_PASSWORD_LENGTH}+ character password.
                    </Text>

                    <TextInput
                        type="password"
                        name="password"
                        value={formState.password}
                        onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                            updateFormField('password', ev.target.value)
                        }
                        disabled={isAnyLoading}
                    />

                    {validation.showPasswordError && (
                        <Text variant="small" color="negative" className='ml-1 mt-2'>
                            Password must be at least {MIN_PASSWORD_LENGTH} characters
                        </Text>
                    )}
                </div>

                <div className='flex flex-col'>
                    <Text variant="normal" fontWeight="medium" color="text80" className='mb-1'>
                        Confirm password
                    </Text>

                    <TextInput
                        type="password"
                        name="confirmPassword"
                        value={formState.confirmPassword}
                        onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                            updateFormField('confirmPassword', ev.target.value)
                        }
                        disabled={isAnyLoading}
                    />

                    {validation.showPasswordMismatchError && (
                        <Text variant="small" color="negative" className='ml-1 mt-2'>
                            Passwords must match
                        </Text>
                    )}
                </div>

                {loadingState.isSearchingWallets && (
                    <div className='self-center items-center gap-1'>
                        <Spinner size="md" />
                        <Text variant="small" color="text80">
                            Searching for wallet address...
                        </Text>
                    </div>
                )}

                {!loadingState.isSearchingWallets && possibleWallets.length > 0 && (
                    <WalletList
                        possibleWallets={possibleWallets}
                    />
                )}

                {errorMessage && (
                    <Text variant="small" color="negative">
                        {errorMessage}
                    </Text>
                )}

                <div className='flex flex-row gap-4'>
                    <Button
                        variant="primary"
                        size={isMobile ? 'lg' : 'md'}
                        shape="square"
                        className='ml-auto'
                        disabled={!validation.isFormValid || isAnyLoading}
                        onClick={handleRecoverWallet}
                    >
                        {loadingState.isRecovering ? 'Recovering...' : 'Recover wallet'}
                    </Button>
                </div>
            </div>

            {isNetworkModalOpen && (
                <Modal onClose={() => walletStore.isNetworkModalOpen.set(false)}>
                    <Networks />
                </Modal>
            )}
        </div>
    )
}

export default Recovery
