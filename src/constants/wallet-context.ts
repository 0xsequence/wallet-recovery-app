import { commons } from '@0xsequence/core'
import { ethers } from 'ethers'

export const v1GuardURL = 'https://guard.sequence.app'
export const v2GuardURL = 'https://guard.sequence.app'
export const v1GuardAddress = '0x596aF90CecdBF9A768886E771178fd5561dD27Ab'
export const v2GuardAddress = '0x761f5e29944D79d76656323F106CF2efBF5F09e9'
export const v1GuardStubSignature =
  '0x000100014e82f02f388a12b5f9d29eaf2452dd040c0ee5804b4e504b4dd64e396c6c781f2c7624195acba242dd825bfd25a290912e3c230841fd55c9a734c4de8d9899451b020101ffffffffffffffffffffffffffffffffffffffff03'
export const v2GuardStubSignature =
  '0x0200010000000003000000000000000000000001ffffffffffffffffffffffffffffffffffffffff0400004400014e82f02f388a12b5f9d29eaf2452dd040c0ee5804b4e504b4dd64e396c6c781f2c7624195acba242dd825bfd25a290912e3c230841fd55c9a734c4de8d9899451b0203'
export const v1TestnetGuardAddress = '0x9999991Af3420dFa7cD874d5CB3445793bb5f691'
export const v1TestnetGuardPK = '0x7c20cb09a5735d918c93f146eb720b22d6311789c3d804eed66daea19052c780'

// Move this to Sequence.js, maybe create a new "releases" package
const DEFAULT_CREATION_CODE = '0x603a600e3d39601a805130553df3363d3d373d3d3d363d30545af43d82803e903d91601857fd5bf3'
export const SEQUENCE_CONTEXT: commons.context.VersionedContext = {
  [1]: {
    version: 1,
    factory: '0xf9D09D634Fb818b05149329C1dcCFAeA53639d96',
    mainModule: '0xd01F11855bCcb95f88D7A48492F66410d4637313',
    mainModuleUpgradable: '0x7EFE6cE415956c5f80C6530cC6cc81b4808F6118',
    guestModule: '0x02390F3E6E5FD1C6786CB78FD3027C117a9955A7',
    walletCreationCode: DEFAULT_CREATION_CODE
  },
  [2]: {
    version: 2,
    factory: '0xFaA5c0b14d1bED5C888Ca655B9a8A5911F78eF4A',
    mainModule: '0xfBf8f1A5E00034762D928f46d438B947f5d4065d',
    mainModuleUpgradable: '0x4222dcA3974E39A8b41c411FeDDE9b09Ae14b911',
    guestModule: '0xfea230Ee243f88BC698dD8f1aE93F8301B6cdfaE',
    walletCreationCode: DEFAULT_CREATION_CODE
  }
}

export const V1_TESTNET_GUARD = new ethers.Wallet(v1TestnetGuardPK)
if (V1_TESTNET_GUARD.address !== v1TestnetGuardAddress) {
  throw new Error('V1_TESTNET_GUARD address does not match v1TestnetGuardAddress()')
}

export const V1_GUARD_SERVICE = {
  address: v1GuardAddress,
  hostname: v1GuardURL
}

export const V2_GUARD_SERVICE = {
  address: v2GuardAddress,
  hostname: v2GuardURL
}

export const NETWORK_FEE_ADDRESSES = [
  '0x7e08701cC9194eF4fFD82421dd0d986d1B43D521',
  '0xd312Ad5426935A65e14E818ba4C9B7f44111B683',
  '0x909693cf965c0cf89C70dBfc2933E91eB10C0FAf'
]
