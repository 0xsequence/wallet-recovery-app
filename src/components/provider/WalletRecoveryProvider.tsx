'use client'

import { WalletRecoveryContext, WalletRecoveryProviderProps } from "~/hooks/wallet-recovery-context"


export function WalletRecoveryProvider(props: WalletRecoveryProviderProps) {
       const { value, children } = props

       return <WalletRecoveryContext.Provider value={value}>{children}</WalletRecoveryContext.Provider>
}
