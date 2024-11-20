import { Box, Button, Card, Modal, Text, TextInput } from '@0xsequence/design-system'
import { ChangeEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import { WALLET_WIDTH } from '~/routes/Wallet'

import RecoveryFooter from '~/components/recovery/RecoveryFooter'

import contractsIcon from '~/assets/icons/contracts.svg'
import walletIcon from '~/assets/icons/wallet.svg'
import sequenceRecoveryLogo from '~/assets/images/sequence-wallet-recovery.svg'

function Landing() {
  const authStore = useStore(AuthStore)
  const isLoadingAccount = useObservable(authStore.isLoadingAccount)

  const [password, setPassword] = useState('')
  const [isReseting, setIsReseting] = useState(false)
  const [wrongPassword, setWrongPassword] = useState(false)

  const handleUnlock = async () => {
    try {
      await authStore.loadAccount(password)
    } catch (e) {
      console.warn(e)
      setWrongPassword(true)
    }
  }

  const handleResetConfirmation = () => {
    setIsReseting(true)
  }

  const handleReset = () => {
    authStore.logout()
    setIsReseting(false)
    authStore.isLoadingAccount.set(false)
  }

  return (
    // TODO Change background to match figma
    <Box justifyContent="center" background="backgroundPrimary" height="vh">
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="full"
        style={{ maxWidth: WALLET_WIDTH }}
        gap="10"
        paddingY="10"
      >
        <Box flexDirection="column" gap="6">
          <img src={sequenceRecoveryLogo} alt="Sequence Recovery Wallet Logo" height="28px" />
          <Text
            textAlign="center"
            variant="xlarge"
            color="text100"
            style={{ fontSize: '40px', lineHeight: '44px' }}
          >
            A fully open source and forever accessible <br /> way to recover your Sequence Wallet
          </Text>
        </Box>

        {isLoadingAccount ? (
          <>
            <Text variant="normal" color="text100">
              Enter your password to continue and unlock your wallet
            </Text>
            <Box flexDirection="column" gap="4" width="3/4">
              <Box flexDirection="column" gap="1">
                <Text variant="normal" color="text100">
                  Password
                </Text>
                <TextInput
                  type="password"
                  value={password}
                  onKeyPress={(ev: KeyboardEvent) => {
                    if (ev.key === 'Enter') {
                      handleUnlock()
                    }
                  }}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                    setPassword(ev.target.value)
                    setWrongPassword(false)
                  }}
                />
                {wrongPassword && (
                  <Text variant="small" color="negative" marginLeft="2" marginTop="1">
                    Incorrect password
                  </Text>
                )}
              </Box>
              <Box flexDirection="row-reverse" gap="4">
                <Button label="Continue" variant="primary" shape="square" onClick={() => handleUnlock()} />
                <Button
                  label="Forgot password?"
                  variant="text"
                  shape="square"
                  onClick={() => handleResetConfirmation()}
                />
              </Box>
            </Box>
          </>
        ) : (
          <>
            <Box gap="2">
              {/* TODO: Change link */}
              <Button label="Learn more" size="md" />
              <Button as={Link} to="/recovery" label="Start Recovery" variant="primary" size="md" />
            </Box>
            <Box flexDirection="row" gap="2" width="2/3">
              <Card flexDirection="column" gap="2">
                <Box flexDirection="row" gap="2">
                  <img src={contractsIcon}></img>
                  <Text variant="normal" fontWeight="bold" color="text100">
                    Connect to Applications
                  </Text>
                </Box>
                <Text variant="normal" color="text50">
                  Connect your wallet to any web3 application via Walletconnect
                </Text>
              </Card>
              <Card flexDirection="column" gap="2">
                <Box flexDirection="row" gap="2">
                  <img src={walletIcon}></img>
                  <Text variant="normal" fontWeight="bold" color="text100">
                    Move funds anywhere
                  </Text>
                </Box>
                <Text variant="normal" color="text50">
                  Transfer funds securely to any wallet, fully decentralized
                </Text>
              </Card>
            </Box>
          </>
        )}
      </Box>

      {isReseting && (
        <Modal size="md" onClose={() => setIsReseting(false)}>
          <Box flexDirection="column" alignItems="center" padding="16">
            <Text variant="md" color="text100">
              Click <Text fontWeight="bold">Reset</Text> to start over. This will require you to re-enter your
              mnemonic.
            </Text>
            <Box flexDirection={{ sm: 'column', md: 'row' }} gap="2" width="full" marginTop="10">
              <Button
                width="full"
                label={`Cancel`}
                onClick={() => {
                  setIsReseting(false)
                }}
                shape="square"
                data-id="signingCancel"
              />

              <Button
                width="full"
                variant="primary"
                label={'Reset'}
                onClick={() => {
                  handleReset()
                }}
                shape="square"
                data-id="signingContinue"
              />
            </Box>
          </Box>
        </Modal>
      )}

      <RecoveryFooter />
    </Box>
    // <>
    //   <Box
    //     flexDirection="row"
    //     width="full"
    //     background="backgroundMuted"
    //     justifyContent="flex-end"
    //     paddingX="20"
    //     paddingY="4"
    //     style={{ height: '64.12px' }}
    //   >
    //     <Button label="Networks" variant="text" onClick={() => setIsNetworkModalOpen(true)} />
    //   </Box>
    //   <Box
    //     background="backgroundPrimary"
    //     width="full"
    //     height="full"
    //     paddingX="8"
    //     alignItems="center"
    //     justifyContent="center"
    //   >
    //     <Box width="full" style={{ maxWidth: '800px' }}>
    //       <Box padding="6" marginTop="16">
    //         <Box flexDirection="column" alignItems="center" justifyContent="center" gap="6">
    //           <img src={sequenceLogo} alt="Sequence Logo" style={{ width: '100px', height: '100px' }} />
    //           <Text variant="large" color="text100" textAlign="center">
    //             Sequence <br /> Wallet Recovery
    //           </Text>
    //         </Box>
    //       </Box>

    //       {!isLoadingAccount && (
    //         <>
    //           <Box marginTop="8">
    //             <Card flexDirection="column" gap="6">
    //               <Text variant="medium" color="warning" textAlign="center">
    //                 Warning section
    //               </Text>

    //               <Text variant="normal" color="text100" marginBottom="4">
    //                 At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
    //                 voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati
    //                 cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id
    //                 est laborum et dolorum fuga. At vero eos et accusamus et iusto odio dignissimos ducimus
    //                 qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas
    //                 molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui
    //                 officia deserunt mollitia animi, id est laborum et dolorum fuga.
    //               </Text>
    //             </Card>
    //           </Box>

    //           <Box alignItems="center" justifyContent="center" flexDirection="column">
    //             <Box>
    //               <Button
    //                 as={Link}
    //                 to="/recovery"
    //                 variant="primary"
    //                 size="lg"
    //                 shape="square"
    //                 label="Start Recovery"
    //                 width="full"
    //                 marginTop="16"
    //               />
    //             </Box>
    //             <Box>
    //               <Button
    //                 variant="text"
    //                 size="lg"
    //                 shape="square"
    //                 label="Learn more"
    //                 width="full"
    //                 marginTop="6"
    //               />
    //             </Box>
    //           </Box>
    //         </>
    //       )}

    //       {isLoadingAccount && (
    //         <>
    //           {isPromptingForPassword ? (
    //             <Box flexDirection="column" marginTop="8" justifyContent="center" alignItems="center">
    //               <Text variant="large" color="text100" marginBottom="8">
    //                 Welcome back!
    //               </Text>

    //               <Box width="full">
    //                 <TextInput
    //                   label="Password"
    //                   labelLocation="top"
    //                   type="password"
    //                   value={password}
    //                   onKeyPress={(ev: KeyboardEvent) => {
    //                     if (ev.key === 'Enter') {
    //                       handleUnlock()
    //                     }
    //                   }}
    //                   onChange={(ev: ChangeEvent<HTMLInputElement>) => {
    //                     setPassword(ev.target.value)
    //                     setWrongPassword(false)
    //                   }}
    //                 />
    //               </Box>

    //               <Box alignSelf="flex-start" height="6">
    //                 {wrongPassword && (
    //                   <Text variant="small" color="negative" marginLeft="2" marginTop="1">
    //                     Incorrect password
    //                   </Text>
    //                 )}
    //               </Box>
    //               <Button
    //                 marginBottom="3"
    //                 variant="primary"
    //                 size="lg"
    //                 shape="square"
    //                 label="Unlock"
    //                 onClick={() => {
    //                   handleUnlock()
    //                 }}
    //               />
    //               <Box>
    //                 <Button
    //                   variant="text"
    //                   label="Forgot your password?"
    //                   onClick={() => {
    //                     handleResetConfirmation()
    //                   }}
    //                 />
    //               </Box>
    //             </Box>
    //           ) : (
    //             <Box marginTop="8" alignItems="center" justifyContent="center">
    //               <Card width="16" alignItems="center" justifyContent="center">
    //                 <Spinner size="lg" />
    //               </Card>
    //             </Box>
    //           )}
    //         </>
    //       )}
    //     </Box>
    //     {isReseting && (
    //       <Modal size="md" onClose={() => setIsReseting(false)}>
    //         <Box flexDirection="column" alignItems="center" padding="16">
    //           <Text variant="md" color="text100">
    //             Click <Text fontWeight="bold">Reset</Text> to start over. This will require you to re-enter
    //             your mnemonic.
    //           </Text>
    //           <Box flexDirection={{ sm: 'column', md: 'row' }} gap="2" width="full" marginTop="10">
    //             <Button
    //               width="full"
    //               label={`Cancel`}
    //               onClick={() => {
    //                 setIsReseting(false)
    //               }}
    //               data-id="signingCancel"
    //             />

    //             <Button
    //               width="full"
    //               variant="primary"
    //               label={'Reset'}
    //               onClick={() => {
    //                 handleReset()
    //               }}
    //               data-id="signingContinue"
    //             />
    //           </Box>
    //         </Box>
    //       </Modal>
    //     )}
    //     {isNetworkModalOpen && (
    //       <Modal onClose={() => setIsNetworkModalOpen(false)}>
    //         <Networks />
    //       </Modal>
    //     )}
    //   </Box>
    // </>
  )
}

export default Landing
