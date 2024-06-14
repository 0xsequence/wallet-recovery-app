import { BytesLike, ethers } from 'ethers'

const messageToBytes = (message: BytesLike): Uint8Array => {
  if (ethers.utils.isBytesLike(message)) {
    return ethers.utils.arrayify(message)
  }

  return ethers.utils.toUtf8Bytes(message)
}

export const prefixEIP191Message = (message: BytesLike): Uint8Array => {
  const messageBytes = messageToBytes(message)
  const eip191prefix = ethers.utils.toUtf8Bytes('\x19Ethereum Signed Message:\n')
  return ethers.utils.concat([eip191prefix, ethers.utils.toUtf8Bytes(String(messageBytes.length)), messageBytes])
}
