import { Account } from '@0xsequence/account'
import { universal } from '@0xsequence/core'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  Spinner,
  Text,
  TextArea,
  TextInput
} from '@0xsequence/design-system'
import { ChainId } from '@0xsequence/network'
import { Orchestrator } from '@0xsequence/signhub'
import { ethers } from 'ethers'
import { ChangeEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { TRACKER } from '~/utils/tracker'
import { truncateMiddle } from '~/utils/truncate'

import { SEQUENCE_CONTEXT } from '~/constants/wallet-context'
import { WALLETS } from '~/constants/wallets'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { NetworkStore } from '~/stores/NetworkStore'

import { PasswordInput } from '~/components/PasswordInput'

import sequenceLogo from '~/assets/images/sequence-logo.svg'

function Recovery() {
  const authStore = useStore(AuthStore)
  const networkStore = useStore(NetworkStore)
  const networks = networkStore.networks.get()

  const [wallet, setWallet] = useState('')
  const [possibleWallets, setPossibleWallets] = useState([] as string[])
  const [mnemonic, setMnemonic] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [usingPassword, setUsingPassword] = useState(false)
  const [selectingOtherWallets, setSelectingOtherWallets] = useState(false)

  const [warnWrongAddress, setWarnWrongAddress] = useState(false)
  const [isReadyToContinue, setIsReadyToContinue] = useState(false)
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const isLoadingAccount = useObservable(authStore.isLoadingAccount)

  useEffect(() => {
    setWarnWrongAddress(false)

    if (!ethers.isAddress(wallet)) {
      return
    }

    setIsLoadingWallets(true)
    const walletAddress = ethers.getAddress(wallet)
    validateAddress(walletAddress)
  }, [wallet])

  const handleSignInWithRecoveryMnemonic = () => {
    const walletAddress = ethers.getAddress(wallet)
    if (usingPassword) {
      authStore.signInWithRecoveryMnemonic(walletAddress, mnemonic.trim(), password)
    } else {
      authStore.signInWithRecoveryMnemonic(walletAddress, mnemonic.trim())
    }
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
        setWarnWrongAddress(true)
      }
    } catch (error) {
      setWarnWrongAddress(true)
      console.error(error)
    }

    setIsLoadingWallets(false)
  }

  const handleSelectingOtherWallets = () => {
    setSelectingOtherWallets(!selectingOtherWallets)
    setWallet(possibleWallets[0])
  }

  return (
    <Box
      background="backgroundPrimary"
      width="full"
      height="full"
      paddingX="8"
      alignItems="center"
      justifyContent="center"
    >
      <Box width="full" style={{ maxWidth: '800px' }} marginBottom="16">
        <Box padding="6" marginTop="16">
          <Box flexDirection="column" alignItems="center" justifyContent="center" gap="6">
            <img src={sequenceLogo} alt="Sequence Logo" style={{ width: '100px', height: '100px' }} />
            <Text variant="large" color="text100" textAlign="center">
              Sequence <br /> Wallet Recovery
            </Text>
          </Box>
        </Box>

        {/* <Card marginTop="12"> */}
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

            {validMnemonic() && (
              <Box flexDirection="column" gap="8" marginTop="3" marginLeft="1">
                <Checkbox
                  color="primary"
                  labelLocation="right"
                  label={
                    <Text color="text80" underline="true">
                      Use Password to Encrypt Mnemonic (Optional)
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
                        onChange={(ev: ChangeEvent<HTMLInputElement>) => setConfirmPassword(ev.target.value)}
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

                {selectingOtherWallets && possibleWallets.length > 1 && (
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

                  {warnWrongAddress && (
                    <Box justifyContent="center" marginTop="2">
                      <Text variant="small" color="negative">
                        Wallet does not match recovery phrase
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
        {/* </Card> */}
      </Box>
    </Box>
  )
}

export default Recovery
