import { Box, Button, Modal, Text, TextInput, useMediaQuery } from '@0xsequence/design-system'
import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { getMnemonic } from '~/utils/getMnemonic'

interface PasswordUnlockProps {
       onUnlockSuccess?: () => void
       redirectOnSuccess?: boolean
}

export function PasswordUnlock({ onUnlockSuccess, redirectOnSuccess = true }: PasswordUnlockProps) {
       const isMobile = useMediaQuery('isMobile')
       const navigate = useNavigate()
       const authStore = useStore(AuthStore)
       const isLoadingAccountObservable = useObservable(authStore.isLoadingAccount)

       const [password, setPassword] = useState('')
       const [isReseting, setIsReseting] = useState(false)
       const [wrongPassword, setWrongPassword] = useState(false)
       const [isLoadingAccount, setIsLoadingAccount] = useState(false)
       const [isUnlocking, setIsUnlocking] = useState(false)

       useEffect(() => {
              setIsLoadingAccount(isLoadingAccountObservable)
       }, [isLoadingAccountObservable])

       const handleUnlock = async () => {
              try {
                     setIsUnlocking(true)
                     await authStore.loadAccount(password).then(async () => {
                            if (redirectOnSuccess) {
                                   const recoveryWalletVersion = await getMnemonic({ authStore }).catch((e) => {
                                          console.warn(e)
                                          return ''
                                   })

                                   if (recoveryWalletVersion.trim().split(/\s+/g).length === 12) {
                                          navigate('/wallet-v2-recovery')
                                   } else {
                                          navigate('/wallet-v3-recovery')
                                   }
                            } else {
                                   onUnlockSuccess?.()
                            }
                     })
              } catch (e) {
                     console.warn(e)
                     setWrongPassword(true)
                     setIsUnlocking(false)
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

       if (!isLoadingAccount) {
              return null
       }

       return (
              <>
                     <Text
                            variant="normal"
                            fontWeight="medium"
                            textAlign="center"
                            color="text80"
                            paddingX={isMobile ? '8' : undefined}
                            style={{ marginBottom: '-16px' }}
                     >
                            Enter your password to continue and unlock your wallet
                     </Text>
                     <Box flexDirection="column" gap="4" width="full">
                            <Box flexDirection="column" gap="1">
                                   <Text variant="normal" fontWeight="medium" color="text80">
                                          Password
                                   </Text>
                                   <TextInput
                                          type="password"
                                          value={password}
                                          autoFocus
                                          disabled={isUnlocking}
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
                            <Box flexDirection="row" justifyContent="flex-end" gap="4">
                                   <Button
                                          label="Forgot password?"
                                          variant="text"
                                          shape="square"
                                          disabled={isUnlocking}
                                          onClick={() => handleResetConfirmation()}
                                   />
                                   <Button
                                          label="Continue"
                                          variant="primary"
                                          shape="square"
                                          disabled={isUnlocking}
                                          onClick={() => handleUnlock()}
                                   />
                            </Box>
                     </Box>

                     {isReseting && (
                            <Modal size="md" onClose={() => setIsReseting(false)}>
                                   <Box flexDirection="column" padding="6" gap="6">
                                          <Text variant="large" color="text100" marginRight="8">
                                                 Are you sure you want to sign out?
                                          </Text>
                                          <Text variant="normal" fontWeight="medium" color="text50">
                                                 If you do not remember your password, you can reset and start over.
                                                 <br /> This will require you to re-enter your mnemonic.
                                          </Text>
                                          <Box flexDirection="row" justifyContent="flex-end" gap="2">
                                                 <Button label="Yes, reset" shape="square" variant="primary" onClick={() => handleReset()} />
                                                 <Button label="Cancel" shape="square" onClick={() => setIsReseting(false)} />
                                          </Box>
                                   </Box>
                            </Modal>
                     )}
              </>
       )
}
