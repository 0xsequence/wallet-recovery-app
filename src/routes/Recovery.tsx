import { Box, Button, Card, Checkbox, Spinner, Text, TextArea, TextInput } from '@0xsequence/design-system'
import { ethers } from 'ethers'
import { ChangeEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import sequenceLogo from '~/assets/images/sequence-logo.svg'
import { PasswordInput } from '~/components/PasswordInput'
import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { TRACKER } from '~/utils/tracker'

function Recovery() {
  const authStore = useStore(AuthStore)
  const [wallet, setWallet] = useState('')
  const [wallets, setWallets] = useState([] as string[])
  const [mnemonic, setMnemonic] = useState('')
  const [password, setPassword] = useState('')
  const [usingPassword, setUsingPassword] = useState(false)

  const isLoadingAccount = useObservable(authStore.isLoadingAccount)

  const handleSignInWithRecoveryMnemonic = () => {
    if (usingPassword) {
      authStore.signInWithRecoveryMnemonic(ethers.getAddress(wallet), mnemonic.trim(), password)
    } else {
      authStore.signInWithRecoveryMnemonic(ethers.getAddress(wallet), mnemonic.trim())
    }
  }

  const notValidMnemonic = () => {
    return mnemonic && mnemonic.replace(/\s+/g, ' ').trim().split(' ').length !== 12
  }

  const notValidPassword = () => {
    return password && password.length < 8
  }

  const updateMnemonic = async (mnemonic: string) => {
    setWallets([])
    setMnemonic(mnemonic)

    if (notValidMnemonic()) {
      return
    }

    try {
      const signer = ethers.Wallet.fromPhrase(mnemonic)

      const wallets = await TRACKER.walletsOfSigner({ signer: signer.address })

      setWallets(wallets.map(({ wallet }) => wallet))
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Box
      background="backgroundPrimary"
      width="full"
      height="full"
      paddingX="8"
      alignItems="center"
      justifyContent="center"
      marginBottom="16"
    >
      <Box width="full" style={{ maxWidth: '800px' }}>
        <Box padding="6" marginTop="16">
          <Box flexDirection="column" alignItems="center" justifyContent="center" gap="6">
            <img src={sequenceLogo} alt="Sequence Logo" style={{ width: '100px', height: '100px' }} />
            <Text variant="large" color="text100" textAlign="center">
              Sequence <br /> Wallet Recovery
            </Text>
          </Box>
        </Box>

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

          <Box flexDirection="column" marginTop="12" gap="8">
            <Box>
              <TextArea
                name="mnemonic"
                label="Recovery Phrase"
                labelLocation="top"
                value={mnemonic}
                onChange={ev => updateMnemonic(ev.target.value)}
              />
              {notValidMnemonic() && (
                <Text variant="small" color="negative" marginLeft="1" marginTop="2">
                  Mnemonic must be 12 words
                </Text>
              )}
            </Box>

            <Checkbox
              labelLocation="right"
              label="Use Password to Encrypt Mnemonic (Optional)"
              checked={usingPassword}
              onCheckedChange={checked => {
                setUsingPassword(checked === true)
              }}
            ></Checkbox>

            {usingPassword && (
              <Box>
                <PasswordInput
                  label="Create Password (min 8 characters)"
                  value={password}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) => setPassword(ev.target.value)}
                ></PasswordInput>
                {notValidPassword() && (
                  <Text variant="small" color="negative" marginLeft="1" marginTop="2">
                    Password not long enough
                  </Text>
                )}
              </Box>
            )}

            <TextInput
              name="wallet"
              label="Sequence Wallet Address"
              labelLocation="left"
              value={wallet}
              onChange={(ev: ChangeEvent<HTMLInputElement>) => setWallet(ev.target.value)}
            />

            <Text variant="small" color="text100">Possible Wallets</Text>

            <Box flexDirection="column">
              {wallets.map(wallet => (
                <Button marginBottom="2" shape="square" label={wallet} onClick={() => setWallet(wallet)} />
              ))}
            </Box>
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
                  disabled={!mnemonic || !ethers.isAddress(wallet) || (usingPassword && (!password || password.length < 8))}
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
      </Box>
    </Box>
  )
}

export default Recovery
