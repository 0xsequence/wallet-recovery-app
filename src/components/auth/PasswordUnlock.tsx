import { Button, cn, Modal, Text, TextInput, useMediaQuery } from '@0xsequence/design-system'
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
                            className={cn("text-center", isMobile ? 'px-8' : undefined)}
                            color="text80"
                            style={{ marginBottom: '-16px' }}
                     >
                            Enter your password to continue and unlock your wallet
                     </Text>
                     <div className="flex flex-col gap-4 w-full">
                            <div className='flex flex-col gap-1'>
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
                                          <Text variant="small" color="negative" className='ml-2 mt-1'>
                                                 Incorrect password
                                          </Text>
                                   )}
                            </div>
                            <div className="flex flex-row justify-end gap-4">
                                   <Button
                                          variant="text"
                                          shape="square"
                                          disabled={isUnlocking}
                                          onClick={() => handleResetConfirmation()}
                                   >
                                          Forgot password?
                                   </Button>
                                   <Button
                                          variant="primary"
                                          shape="square"
                                          disabled={isUnlocking}
                                          onClick={() => handleUnlock()}
                                   >
                                          Continue
                                   </Button>
                            </div>
                     </div>

                     {isReseting && (
                            <Modal size="sm" onClose={() => setIsReseting(false)}>
                                   <div className='flex flex-col gap-6 p-6'>
                                          <Text variant="large" color="text100" className='mr-8'>
                                                 Are you sure you want to sign out?
                                          </Text>
                                          <Text variant="normal" fontWeight="medium" color="text50">
                                                 If you do not remember your password, you can reset and start over.
                                                 <br /> This will require you to re-enter your mnemonic.
                                          </Text>
                                          <div className='flex flex-row justify-end gap-2'>
                                                 <Button shape="square" variant="primary" onClick={() => handleReset()}>
                                                        Yes, reset
                                                 </Button>
                                                 <Button shape="square" onClick={() => setIsReseting(false)}>
                                                        Cancel
                                                 </Button>
                                          </div>
                                   </div>
                            </Modal>
                     )}
              </>
       )
}
