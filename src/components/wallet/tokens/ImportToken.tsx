import {
  Button,
  Card,
  CheckmarkIcon,
  cn,
  Modal,
  RefreshIcon,
  SearchIcon,
  Select,
  Spinner,
  Text,
  TextInput,
  useToast
} from '@0xsequence/design-system'
import { ContractType } from '@0xsequence/indexer'
import { NetworkConfig, NetworkType } from '@0xsequence/network'
import { ChangeEvent, useEffect, useRef, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'
import { TokenStore, UserAddedTokenInitialInfo } from '~/stores/TokenStore'

export default function ImportToken({ onClose }: { onClose: () => void }) {
  const networkStore = useStore(NetworkStore)
  const networks = networkStore.networks.get()
  const mainnetNetworks = networks.filter(network => network.type === NetworkType.MAINNET)

  const tokenStore = useStore(TokenStore)

  const isFetchingTokenInfo = useObservable(tokenStore.isFetchingTokenInfo)

  const toast = useToast()

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig>(mainnetNetworks[0])
  const [tokenManualAddress, setTokenManualAddress] = useState<string>('')

  const [tokenInfo, setTokenInfo] = useState<UserAddedTokenInitialInfo>()

  const [isAddingToken, setIsAddingToken] = useState(false)
  const [confirmRefreshList, setConfirmRefreshList] = useState(false)

  const [isAddingTokenManually, setIsAddingTokenManually] = useState(false)

  const [tokenList, setTokenList] = useState<any[]>([])
  const [tokenListDate, setTokenListDate] = useState<Date | undefined>()
  const [tokenListFilter, setTokenListFilter] = useState<string>('')
  const [filteredTokenList, setFilteredTokenList] = useState<any[]>([])

  const [selectedTokens, setSelectedTokens] = useState<any[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tokenManualAddress) {
      const fetchTokenInfo = async () => {
        if (selectedNetwork) {
          const tokenInfo = await tokenStore.getTokenInfo(selectedNetwork.chainId, tokenManualAddress)
          setTokenInfo(tokenInfo)
        }
      }
      fetchTokenInfo()
    }
  }, [selectedNetwork, tokenManualAddress])

  /* const selectOptions = mainnetNetworks
     .filter(network => !network.disabled)
     .map(network => ({
       label: (
         <div className='flex flex-row items-center gap-2'>
           <img src={network.logoURI} className='w-8 h-8' />
           <Text>{network.title}</Text>
         </div>
       ),
       value: network.chainId.toString()
     }))
       */

  useEffect(() => {
    const fetchTokenList = async () => {
      if (selectedNetwork) {
        try {
          const tokenData = await tokenStore.getTokenList(selectedNetwork.chainId)

          const tokenList = tokenData.tokens
          const tokenListDate = new Date(tokenData.date)
          setTokenList(tokenList)
          setTokenListDate(tokenListDate)
        } catch {
          setTokenList([])
          setTokenListDate(undefined)
        }
      }
    }

    fetchTokenList()
  }, [selectedNetwork])

  useEffect(() => {
    if (!tokenListFilter) { return setFilteredTokenList(tokenList.slice(0, 8)) }
    setFilteredTokenList(
      tokenList
        .filter(token => token.symbol && token.symbol.toLowerCase().includes(tokenListFilter.toLowerCase()))
        .slice(0, 8)
    )
  }, [tokenList, tokenListFilter])

  useEffect(() => {
    selectedTokens.map(async token => {
      if (!token.info?.balance && selectedNetwork) {
        const tokenInfo = await tokenStore.getTokenInfo(selectedNetwork.chainId, token.address)
        token.info = tokenInfo
      }
    })
  }, [selectedTokens])

  const toggleSelectToken = async (tokenAddress: string) => {
    const isSelected = selectedTokens.some(token => token.address === tokenAddress)
    if (isSelected) {
      setSelectedTokens(selectedTokens.filter(token => token.address !== tokenAddress))
    } else {
      setSelectedTokens([...selectedTokens, { address: tokenAddress, info: undefined }])
    }
  }

  const handleAdd = async () => {
    try {
      if (selectedNetwork && ((tokenManualAddress && tokenInfo) || selectedTokens.length)) {
        setIsAddingToken(true)

        if (tokenManualAddress && tokenInfo && tokenInfo.symbol && tokenInfo.decimals) {
          await tokenStore.addToken({
            chainId: selectedNetwork.chainId,
            address: tokenManualAddress,
            contractType: ContractType.ERC20,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals
          })
        }

        if (selectedTokens.length > 0) {
          selectedTokens.map(async token => {
            await tokenStore.addToken({
              chainId: selectedNetwork.chainId,
              address: token.address,
              contractType: ContractType.ERC20,
              symbol: token.info.symbol,
              decimals: token.info.decimals
            })
          })
        }

        setIsAddingToken(false)
        toast({
          variant: 'success',
          title: `ERC20 token${selectedTokens.length + (tokenManualAddress ? 1 : 0) > 1 ? 's' : ''} added successfully`,
          description:
            "You'll be able to see this token on your browser as long as you don't clear your cache."
        })
        onClose()
      }
    } catch (err) {
      console.error(err)
      toast({
        variant: 'error',
        title: `One or more ERC20 tokens failed to add`,
        description: 'Please try again.'
      })
      onClose()
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const text = await file.text()
        const tokenList = JSON.parse(text)

        if (Array.isArray(tokenList)) {
          tokenList.map(token => {
            if (!token.address || !token.symbol) {
              throw new Error('Invalid token list')
            }
          })

          if (selectedNetwork) {
            await tokenStore.addExternalTokenList(selectedNetwork.chainId, tokenList)
          }

          toast({
            variant: 'success',
            title: `Custom token list imported successfully`
          })
          onClose()
        } else {
          throw new Error('Invalid file format')
        }
      } catch (error) {
        console.error(error)
        toast({
          variant: 'error',
          title: 'Failed to import token list',
          description: 'Please ensure the file format is correct.'
        })
      }
    }
  }

  const handleImportCustomTokenList = () => {
    fileInputRef.current?.click()
  }

  const handleRefreshTokenList = async () => {
    if (selectedNetwork) {
      const tokenData = await tokenStore.resetTokenList(selectedNetwork.chainId)
      setTokenList(tokenData.tokens)
      setTokenListDate(new Date(tokenData.date))
    }

    setConfirmRefreshList(false)
  }

  return (
    <div className='flex flex-col h-fit min-h-full'>
      <div className='flex flex-col h-full p-6 gap-6'>
        <div className='flex flex-row items-center gap-4'>
          <Text variant="large" fontWeight="bold" color="text80">
            Import Tokens
          </Text>

          <Select.Helper
            name="tokenNetwork"
            options={mainnetNetworks.map(network => ({
              label: (
                <div className='flex flex-row items-center gap-2'>
                  <img src={network.logoURI} className='w-4 h-4' />
                  <Text variant="normal" className='text-primary/80'>{network.title}</Text>
                </div>
              ),
              value: network.chainId.toString()
            }))}
            value={selectedNetwork?.chainId.toString()}
            onValueChange={value =>
              setSelectedNetwork(networks.find(n => n.chainId === Number(value)) || mainnetNetworks[0])
            }
            className='h-7! rounded-lg!'
          />
        </div>

        <div className='flex flex-col gap-3'>
          <TextInput
            leftIcon={SearchIcon}
            value={tokenListFilter}
            placeholder="Search for a token"
            onChange={(ev: ChangeEvent<HTMLInputElement>) => setTokenListFilter(ev.target.value)}
          />

          <Button
            variant="text"
            onClick={selectedNetwork ? handleImportCustomTokenList : undefined}
          >
            {selectedNetwork
              ? `Import custom token list for ${' ' + selectedNetwork?.title}`
              : 'Select Network to import custom token list'}
          </Button>
        </div>

        <div className='flex flex-col'>
          {filteredTokenList?.map((token, i) => {
            return (
              <div
                key={i}
                className={cn(
                  'flex flex-row items-center justify-between bg-background-primary hover:bg-background-secondary rounded-sm p-3',
                  (selectedTokens?.filter(t => t.address.includes(token.address)).length || 0) > 0 && 'bg-background-secondary'
                )}
                onClick={() => {
                  toggleSelectToken(token.address)
                }}
              >
                <div className='flex flex-row items-center'>
                  <img src={token.logoURI} className='w-6 h-6 rounded-full mr-4' />

                  <Text variant="normal" fontWeight="medium" color="text80">
                    {token.symbol}
                  </Text>
                </div>

                <div className='flex flex-row items-center justify-end gap-2'>
                  {selectedTokens?.filter(t => t.address.includes(token.address)).length > 0 && (
                    <>
                      <Text variant="normal" fontWeight="bold" color="text80">
                        Balance:
                      </Text>
                      {selectedTokens?.filter(t => t.address.includes(token.address))[0].info?.balance ? (
                        <Text variant="normal" fontWeight="bold" color="text80">
                          {selectedTokens?.filter(t => t.address.includes(token.address))[0].info?.balance}
                        </Text>
                      ) : (
                        <Spinner size="md" className='mr-1' />
                      )}
                    </>
                  )}
                  <CheckmarkIcon
                    className={`${(selectedTokens?.filter(t => t.address.includes(token.address)).length || 0) > 0 ? 'text-positive' : 'text-primary/30'}`}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <input
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {tokenListDate && (
          <Button
            shape="square"
            size="xs"
            color="text80"
            onClick={() => setConfirmRefreshList(true)}
          >
            <RefreshIcon size="xs" className='mr-1' />
            Refresh list - last updated: {tokenListDate?.toLocaleString()}
          </Button>
        )}
      </div>

      <div className='mt-auto'>
        <div className='p-6'>
          {isAddingTokenManually && (
            <div className='flex flex-col mb-6 gap-0.5'>
              <Text variant="normal" fontWeight="medium" color="text80">
                Token Address
              </Text>

              <TextInput
                name="tokenAddress"
                value={tokenManualAddress ?? ''}
                onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                  setTokenManualAddress(ev.target.value)
                }}
              />
            </div>
          )}

          {isFetchingTokenInfo && tokenManualAddress ? (
            <div className='flex items-center mb-6 justify-center'>
              <Spinner size="lg" />
            </div>
          ) : (
            tokenInfo && (
              <Card className='flex flex-col mb-6 gap-2'>
                <Text variant="medium" fontWeight="bold" color="text80">
                  {tokenInfo.symbol ?? ''}
                </Text>
                <Text variant="small" color="text80">
                  Your Balance:
                </Text>
                <Text variant="medium" fontWeight="bold" color="text80">
                  {tokenInfo.balance}
                </Text>
              </Card>
            )
          )}
        </div>

        <div className='my-0' />

        <div >
          <div className='flex flex-row p-6 gap-2 pt-4'>
            {isAddingTokenManually ? (
              <Button
                shape="square"
                disabled={!selectedNetwork}
                onClick={() => {
                  setIsAddingTokenManually(false)
                  setTokenManualAddress('')
                  setTokenInfo(undefined)
                }}
              >
                Hide
              </Button>
            ) : (
              <Button
                shape="square"
                disabled={!selectedNetwork}
                onClick={() => {
                  setIsAddingTokenManually(true)
                }}
              >
                Manual Import
              </Button>
            )}

            <Button size="md" shape="square" className='ml-auto' onClick={onClose}>
              Cancel
            </Button>

            <Button
              variant="primary"
              shape="square"
              disabled={(!tokenInfo && !selectedTokens.length) || isAddingToken}
              onClick={() => {
                handleAdd()
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {confirmRefreshList && (
        <Modal size="sm">
          <div className='flex flex-col p-6 gap-6'>
            <Text variant="normal" fontWeight="medium" color="text80" className='pr-4'>
              {`Refreshing list will remove the manually imported list for ${selectedNetwork?.title}. Are you sure you want to continue?`}
            </Text>

            <div className='flex flex-row justify-end gap-3'>
              <Button size="sm" shape="square" onClick={() => setConfirmRefreshList(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                shape="square"
                onClick={handleRefreshTokenList}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
