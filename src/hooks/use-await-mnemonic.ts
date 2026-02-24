import { useCallback, useEffect, useRef } from 'react'
import { manager } from '~/manager'

export function useAwaitMnemonic() {
  const resolverRef = useRef<((value: string) => void) | null>(null)

  const value = useCallback(() => {
    return new Promise<string>(resolve => {
      resolverRef.current = resolve
    })
  }, [])

  const resolve = useCallback((value: string) => {
    if (resolverRef.current) {
      resolverRef.current(value)
      resolverRef.current = null
    }
  }, [])

  useEffect(() => {
    const disposeMnemonicUI = manager.registerMnemonicUI(
      async (respond: (mnemonic: string) => Promise<void>) => {
        const mnemonic = await value()
        if (mnemonic) {
          try {
            await respond(mnemonic)
          } catch (error) {
            disposeMnemonicUI()
            alert('Error with mnemonic: ' + error)
          }
        }
      }
    )
  }, [])

  return { value, resolve }
}
