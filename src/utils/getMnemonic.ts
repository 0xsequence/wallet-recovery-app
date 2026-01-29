import { AuthStore } from "~/stores/AuthStore";

export async function getMnemonic({authStore}: {authStore: AuthStore}) {
  const mnemonic = await authStore.getRecoveryMnemonic()
  
  if (!mnemonic) {
    throw new Error('No mnemonic found')
  }

  return mnemonic
}