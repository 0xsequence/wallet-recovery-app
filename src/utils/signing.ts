import { BytesLike, ethers } from 'ethers'

const messageToBytes = (message: BytesLike): Uint8Array => {
  if (ethers.isBytesLike(message)) {
    return ethers.getBytes(message)
  }

  return ethers.toUtf8Bytes(message)
}

// export const prefixEIP191Message = (message: BytesLike): Uint8Array => {
//   const messageBytes = messageToBytes(message)
//   const eip191prefix = ethers.toUtf8Bytes('\x19Ethereum Signed Message:\n')
//   return ethers.concat([eip191prefix, ethers.toUtf8Bytes(String(messageBytes.length)), messageBytes])
// }
