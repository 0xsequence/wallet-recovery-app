import { Account } from '@0xsequence/account'
import { universal } from '@0xsequence/core'
import {
  Box,
  Button,
  ChevronLeftIcon,
  Divider,
  Modal,
  Spinner,
  Text,
  TextInput
} from '@0xsequence/design-system'
import { ChainId } from '@0xsequence/network'
import { Orchestrator } from '@0xsequence/signhub'
import { ethers } from 'ethers'
import { ChangeEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { TRACKER } from '~/utils/tracker'

import { SEQUENCE_CONTEXT } from '~/constants/wallet-context'
import { WALLETS } from '~/constants/wallets'

import { useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { NetworkStore } from '~/stores/NetworkStore'

import FilledCheckBox from '~/components/helpers/FilledCheckBox'
import Networks from '~/components/network/Networks'
import RecoveryHeader from '~/components/recovery/RecoveryHeader'
import WalletList from '~/components/recovery/WalletList'

import { WALLET_WIDTH } from './Wallet'

function Recovery() {
  const authStore = useStore(AuthStore)
  const networkStore = useStore(NetworkStore)
  const networks = networkStore.networks.get()

  const [wallet, setWallet] = useState('')
  const [possibleWallets, setPossibleWallets] = useState<string[]>([])
  const [mnemonic, setMnemonic] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showMnemonic, setShowMnemonic] = useState(true)
  const [showManualAddress, setShowManualAddress] = useState(false)
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)

  const [warningVisible, setWarningVisible] = useState(false)
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const [isCheckingWallet, setIsCheckingWallet] = useState(false)
  const [isReadyToContinue, setIsReadyToContinue] = useState(false)

  useEffect(() => {
    setWarningVisible(false)
    if (!ethers.isAddress(wallet)) {
      return
    }

    setIsCheckingWallet(true)
    const walletAddress = ethers.getAddress(wallet)
    validateAddress(walletAddress)
  }, [wallet])

  const handleSignInWithRecoveryMnemonic = () => {
    const walletAddress = ethers.getAddress(wallet)
    authStore.signInWithRecoveryMnemonic(walletAddress, mnemonic.trim(), password)
  }

  const validMnemonic = (testMnemonic: string = mnemonic) => {
    return testMnemonic.replace(/\s+/g, ' ').trim().split(' ').length == 12
  }

  const validPassword = () => {
    return password?.length >= 8
  }

  const validAddress = () => {
    return wallet ? ethers.isAddress(wallet) : true
  }

  const updateMnemonic = async (mnemonic: string) => {
    setWallet('')
    setPossibleWallets([])
    setMnemonic(mnemonic)
    setIsReadyToContinue(false)

    if (!validMnemonic(mnemonic)) {
      return
    }

    setIsLoadingWallets(true)

    try {
      const signer = ethers.Wallet.fromPhrase(mnemonic)

      const wallets = [
        ...(await TRACKER.walletsOfSigner({ signer: signer.address })).map(({ wallet }) => wallet),
        ...(WALLETS[signer.address] ?? []).map(({ wallet }) => wallet)
      ]

      setPossibleWallets(wallets)

      if (wallets) {
        setWallet(wallets[0])
      }
    } catch (error) {
      console.error(error)
    }

    setIsLoadingWallets(false)
  }

  const updateWallet = async (wallet: string) => {
    setWallet(wallet)
    setIsReadyToContinue(false)
  }

  const validateAddress = async (wallet: string) => {
    try {
      const recoverySigner = ethers.Wallet.fromPhrase(mnemonic)
      const orchestrator = new Orchestrator([recoverySigner])
      const accountToCheck = new Account({
        address: wallet,
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
      setIsReadyToContinue(match)
      if (!match) {
        setWarningVisible(true)
      }
    } catch (error) {
      setWarningVisible(true)
      console.error('failed to validate wallet address', error)
    }

    setIsCheckingWallet(false)
  }

  return (
    <Box flexDirection="column" background="backgroundPrimary">
      <RecoveryHeader handleNetworkModal={() => setIsNetworkModalOpen(true)} />

      <Box
        alignSelf="center"
        flexDirection="column"
        marginY="10"
        gap="4"
        width="full"
        style={{ maxWidth: WALLET_WIDTH }}
      >
        <Button leftIcon={ChevronLeftIcon} label="Back" size="sm" as={Link} to="/" />

        <Box flexDirection="column">
          <Text variant="xlarge" color="text80">
            Recover your wallet
          </Text>

          <Divider marginY="6" />

          <Text variant="normal" fontWeight="medium" color="text80">
            Recovery phrase
          </Text>

          <Text variant="normal" fontWeight="medium" color="text50" marginBottom="1">
            Paste your 12-word mnemonic, with each word separated by a space.
          </Text>

          <TextInput
            name="mnemonic"
            value={mnemonic}
            type={showMnemonic ? 'text' : 'password'}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => updateMnemonic(ev.target.value)}
          />

          {mnemonic && !validMnemonic() && (
            <Text variant="small" color="negative" marginLeft="1" marginTop="2">
              Mnemonic must be 12 words
            </Text>
          )}
        </Box>

        <Button
          variant="text"
          label={
            <Box flexDirection="row" alignItems="center" gap="1">
              <FilledCheckBox checked={showMnemonic} />
              <Text variant="normal" fontWeight="medium" color="text80">
                Show secret recovery phrase
              </Text>
            </Box>
          }
          onClick={() => setShowMnemonic(!showMnemonic)}
        />

        <Box flexDirection="column">
          <Text variant="normal" fontWeight="medium" color="text80">
            Create password
          </Text>
          <Text variant="normal" fontWeight="medium" color="text50" marginBottom="1">
            Encrypt your mnemonic with an 8+ character password.
          </Text>

          <TextInput
            type="password"
            name="password"
            value={password}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => setPassword(ev.target.value)}
          />

          {password && !validPassword() && (
            <Text variant="small" color="negative" marginLeft="1" marginTop="2">
              Password not long enough
            </Text>
          )}
        </Box>

        <Box flexDirection="column">
          <Text variant="normal" fontWeight="medium" color="text80" marginBottom="1">
            Confirm password
          </Text>

          <TextInput
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => setConfirmPassword(ev.target.value)}
          />

          {password && confirmPassword && password !== confirmPassword && (
            <Text variant="small" color="negative" marginLeft="1" marginTop="2">
              Passwords must match
            </Text>
          )}
        </Box>

        {isLoadingWallets && (
          <Box alignSelf="center" alignItems="center" gap="1">
            <Spinner size="md" />
            <Text variant="small" color="text80">
              Looking for wallet address...
            </Text>
          </Box>
        )}

        {possibleWallets.length > 0 && (
          <WalletList
            possibleWallets={possibleWallets}
            handleSelectWallet={selectedWallet => updateWallet(selectedWallet)}
          />
        )}

        {showManualAddress && (
          <Box flexDirection="column" gap="1">
            <Text variant="normal" fontWeight="bold" color="text100">
              Enter wallet address manually
            </Text>
            <TextInput
              name="wallet"
              labelLocation="top"
              value={wallet}
              onChange={(ev: ChangeEvent<HTMLInputElement>) => updateWallet(ev.target.value)}
            />
          </Box>
        )}

        {isCheckingWallet && (
          <Box alignSelf="center" alignItems="center" gap="1">
            <Spinner size="md" />
            <Text variant="small" color="text80">
              Checking wallet address...
            </Text>
          </Box>
        )}

        {(warningVisible || !validAddress()) && (
          <>
            {warningVisible ? (
              <Text variant="small" color="negative">
                No wallet match found. Try again in 10 min or enter a wallet address manually.
              </Text>
            ) : (
              <Text variant="small" color="negative">
                Invalid wallet address
              </Text>
            )}
          </>
        )}

        <Box flexDirection="row">
          {!showManualAddress && (
            <Button
              label="Enter wallet address manually"
              size="md"
              shape="square"
              onClick={() => setShowManualAddress(true)}
            />
          )}

          <Button
            variant="primary"
            size="md"
            shape="square"
            label="Recover wallet"
            marginLeft="auto"
            disabled={
              !mnemonic ||
              !ethers.isAddress(wallet) ||
              !password ||
              password.length < 8 ||
              password !== confirmPassword ||
              isReadyToContinue === false
            }
            onClick={() => {
              handleSignInWithRecoveryMnemonic()
            }}
          />
        </Box>
      </Box>

      {isNetworkModalOpen && (
        <Modal onClose={() => setIsNetworkModalOpen(false)}>
          <Networks />
        </Modal>
      )}
    </Box>
  )
}

export default Recovery
