import { ethers } from 'ethers'

export interface Encrypted {
  iv: BufferSource
  data: BufferSource
  salt?: Uint8Array
}

export const createKey = async () => {
  return window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  )
}

export const createKeyFromPassword = async (password: string, salt: Uint8Array) => {
  const encoder = new TextEncoder()
  const encodedPassword = encoder.encode(password)

  const passwordKey = await window.crypto.subtle.importKey('raw', encodedPassword, 'PBKDF2', false, [
    'deriveBits',
    'deriveKey'
  ])

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 310000,
      hash: 'SHA-256'
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  )

  return derivedKey
}

export const createSalt = (length = 32) => {
  return window.crypto.getRandomValues(new Uint8Array(length))
}

export const createSaltFromAddress = (address: string) => {
  return ethers.getBytes(address)
}

export const encrypt = async (key: CryptoKey, text: string): Promise<Encrypted> => {
  const encoder = new TextEncoder()
  const encoded = encoder.encode(text)
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const data = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)

  return {
    iv,
    data
  }
}

export const decrypt = async (key: CryptoKey, encrypted: Encrypted): Promise<string> => {
  const { iv, data } = encrypted

  try {
    const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    const decoder = new TextDecoder()

    return decoder.decode(decrypted)
  } catch (err) {
    throw new Error('Could not decrypt data')
  }
}
