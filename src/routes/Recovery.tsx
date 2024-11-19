import { Account } from '@0xsequence/account'
import { universal } from '@0xsequence/core'
import {
  ArrowRightIcon,
  Box,
  Button,
  Checkbox,
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

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { NetworkStore } from '~/stores/NetworkStore'

import Networks from '~/components/Networks'
import RecoveryHeader from '~/components/RecoveryHeader'

function Recovery() {
  const authStore = useStore(AuthStore)
  const networkStore = useStore(NetworkStore)
  const networks = networkStore.networks.get()

  const [wallet, setWallet] = useState('')
  const [possibleWallets, setPossibleWallets] = useState([] as string[])
  const [mnemonic, setMnemonic] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectingOtherWallets, setSelectingOtherWallets] = useState(false)
  const [trackerSuccessful, setTrackerSuccessful] = useState(false)

  const [warningAddress, setWarningAddress] = useState('')
  const [isReadyToContinue, setIsReadyToContinue] = useState(false)
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)

  const isLoadingAccount = useObservable(authStore.isLoadingAccount)

  useEffect(() => {
    setWarningAddress('')

    if (!ethers.isAddress(wallet)) {
      return
    }

    setIsLoadingWallets(true)
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

      setTrackerSuccessful(true)
      setPossibleWallets(wallets)

      if (wallets.length === 1) {
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
        setWarningAddress('Wallet does not match recovery phrase')
      }
    } catch (error) {
      setWarningAddress('Please ensure the RPC URL for Ethereum in Networks (top right) is correct')
      console.error('failed to validate wallet address', error)
    }

    setIsLoadingWallets(false)
  }

  const handleSelectingOtherWallets = () => {
    setSelectingOtherWallets(!selectingOtherWallets)
    setWallet(possibleWallets[0])
  }

  return (
    <Box flexDirection="column" background="backgroundPrimary">
      <RecoveryHeader handleNetworkModal={() => setIsNetworkModalOpen(true)} />

      <Divider marginY="0" />

      <Box
        alignSelf="center"
        flexDirection="column"
        marginY="10"
        gap="4"
        width="full"
        style={{ maxWidth: '800px' }}
      >
        {/* TODO: replace left arrow */}
        <Button leftIcon={ArrowRightIcon} label="Back" size="sm" as={Link} to="/" />
        <Text variant="xlarge" color="text100" marginBottom="8">
          Recover your wallet
        </Text>

        <Box flexDirection="column">
          <Text variant="normal" color="text100">
            Recovery phrase
          </Text>

          <Text variant="normal" color="text50" marginBottom="1">
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

        <Checkbox
          label={
            <Text variant="normal" color="text100">
              Show secret recovery phrase
            </Text>
          }
          labelLocation="right"
          size="lg"
          checked={showMnemonic}
          onCheckedChange={checked => {
            setShowMnemonic(checked === true)
          }}
        />

        <Box flexDirection="column">
          <Text variant="normal" color="text100">
            Create password
          </Text>
          <Text variant="normal" color="text50" marginBottom="1">
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
          <Text variant="normal" color="text100" marginBottom="1">
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
          <Box alignSelf="center" alignItems="center" gap="2">
            <Spinner size="md" />
            <Text variant="small" color="text100">
              Looking for wallet address...
            </Text>
          </Box>
        )}

        <Box justifyContent="space-between">
          <Button label="Enter wallet address manually" size="md" shape="square" />
          {/* <TextInput
            name="wallet"
            label={selectingOtherWallets ? 'Enter Address Manually' : 'Sequence Wallet Address'}
            labelLocation="left"
            disabled={!selectingOtherWallets}
            value={wallet}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => updateWallet(ev.target.value)}
          /> */}

          {warningAddress && (
            <Box justifyContent="center" marginTop="2">
              <Text variant="small" color="negative">
                {warningAddress}
              </Text>
            </Box>
          )}
          <Button
            variant="primary"
            size="md"
            shape="square"
            label="Recover wallet"
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

      {/* Everything below this point is the original code */}

      {/* <Box width="full" style={{ maxWidth: '800px' }} marginBottom="16">
          <Box marginTop="12">
            <Box alignItems="center" justifyContent="center" flexDirection="column">
              <Text variant="medium" color="text100" textAlign="center">
                Enter your recovery phrase
              </Text>

              <Text variant="normal" color="text50" marginTop="4" textAlign="center">
                This is the recovery phrase you create on{' '}
                <Text
                  variant="link"
                  cursor="pointer"
                  color="text80"
                  onClick={() => window.open('https://sequence.app/settings/recovery')}
                >
                  sequence.app/settings/recovery
                </Text>
              </Text>
            </Box>

            <Box flexDirection="column" marginTop="12">
              <Box>
                <TextArea
                  name="mnemonic"
                  label="Recovery Phrase"
                  labelLocation="top"
                  value={mnemonic}
                  onChange={ev => updateMnemonic(ev.target.value)}
                />

                {mnemonic && !validMnemonic() && (
                  <Text variant="small" color="negative" marginLeft="1" marginTop="2">
                    Mnemonic must be 12 words
                  </Text>
                )}
              </Box>

              {trackerSuccessful && validMnemonic() && (
                <Box flexDirection="column" gap="8" marginTop="3" marginLeft="1">
                  <Checkbox
                    color="primary"
                    labelLocation="right"
                    label={
                      <Text color="text80" underline="true">
                        Use Password to Encrypt Mnemonic (Recommended)
                      </Text>
                    }
                    checked={usingPassword}
                    onCheckedChange={checked => {
                      setUsingPassword(checked === true)
                    }}
                  ></Checkbox>

                  {usingPassword && (
                    <Box flexDirection="column" gap="3">
                      <Box>
                        <PasswordInput
                          label="Create Password (min 8 characters)"
                          value={password}
                          onChange={(ev: ChangeEvent<HTMLInputElement>) => setPassword(ev.target.value)}
                        ></PasswordInput>
                        {password && !validPassword() && (
                          <Text variant="small" color="negative" marginLeft="1" marginTop="2">
                            Password not long enough
                          </Text>
                        )}
                      </Box>

                      <Box>
                        <PasswordInput
                          label="Confirm Password"
                          value={confirmPassword}
                          onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                            setConfirmPassword(ev.target.value)
                          }
                        ></PasswordInput>
                        {password && confirmPassword && password !== confirmPassword && (
                          <Text variant="small" color="negative" marginLeft="1" marginTop="2">
                            Passwords must match
                          </Text>
                        )}
                      </Box>
                    </Box>
                  )}

                  <Box>
                    <Divider color="white" />
                    <Box justifyContent="flex-end">
                      <Text
                        marginRight="1"
                        variant="small"
                        color="text80"
                        cursor="pointer"
                        underline="true"
                        onClick={() => {
                          handleSelectingOtherWallets()
                        }}
                      >
                        {selectingOtherWallets ? 'Go back to default wallet' : 'Enter another wallet'}
                      </Text>
                    </Box>
                  </Box>

                  {(selectingOtherWallets || possibleWallets.length > 1) && (
                    <Box flexDirection="column" gap="4">
                      <Box display="grid" gap="4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                        {possibleWallets.map(walletAddress => {
                          return (
                            <Button
                              key={walletAddress}
                              size="lg"
                              shape="square"
                              label={truncateMiddle(walletAddress, 18, 4)}
                              onClick={() => {
                                setWallet(walletAddress)
                              }}
                            />
                          )
                        })}
                      </Box>
                    </Box>
                  )}

                  <Box>
                    <TextInput
                      name="wallet"
                      label={selectingOtherWallets ? 'Enter Address Manually' : 'Sequence Wallet Address'}
                      labelLocation="left"
                      disabled={!selectingOtherWallets}
                      value={wallet}
                      onChange={(ev: ChangeEvent<HTMLInputElement>) => updateWallet(ev.target.value)}
                    />

                    {warningAddress && (
                      <Box justifyContent="center" marginTop="2">
                        <Text variant="small" color="negative">
                          {warningAddress}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {isLoadingWallets && (
                <Box alignItems="center" justifyContent="center" marginTop="4">
                  <Card width="16" alignItems="center" justifyContent="center">
                    <Spinner size="lg" />
                  </Card>
                </Box>
              )}
            </Box>
          </Box>

          <Box alignItems="center" justifyContent="center" flexDirection="column">
            {isLoadingAccount && (
              <Box marginTop="16" alignItems="center" justifyContent="center">
                <Card width="16" alignItems="center" justifyContent="center">
                  <Spinner size="lg" />
                </Card>
              </Box>
            )}
            {!isLoadingAccount && (
              <>
                <Box>
                  <Button
                    variant="primary"
                    size="lg"
                    shape="square"
                    label="Continue"
                    disabled={
                      !mnemonic ||
                      !ethers.isAddress(wallet) ||
                      (usingPassword && (!password || password.length < 8)) ||
                      password !== confirmPassword ||
                      isReadyToContinue === false
                    }
                    onClick={() => {
                      handleSignInWithRecoveryMnemonic()
                    }}
                    width="full"
                    marginTop="16"
                  />
                </Box>
                <Box>
                  <Button
                    as={Link}
                    to="/"
                    variant="text"
                    size="lg"
                    shape="square"
                    label="Go back to start"
                    width="full"
                    marginTop="6"
                  />
                </Box>
              </>
            )}
          </Box>
        </Box> */}
      {isNetworkModalOpen && (
        <Modal onClose={() => setIsNetworkModalOpen(false)}>
          <Networks />
        </Modal>
      )}
    </Box>
  )
}

export default Recovery
