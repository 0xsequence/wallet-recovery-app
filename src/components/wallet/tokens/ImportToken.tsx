import {
  Box,
  Button,
  Card,
  Divider,
  Image,
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

import { FilledRoundCheckBox } from '~/components/misc'

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

  const selectOptions = mainnetNetworks
    .filter(network => !network.disabled)
    .map(network => ({
      label: (
        <Box flexDirection="row" alignItems="center" gap="2">
          <Image src={network.logoURI} maxWidth="8" maxHeight="8" />
          <Text>{network.title}</Text>
        </Box>
      ),
      value: network.chainId.toString()
    }))

  useEffect(() => {
    const fetchTokenList = async () => {
      if (selectedNetwork) {
        try {
          const tokenData = await tokenStore.getTokenList(selectedNetwork.chainId)
          console.log('tokenData', tokenData)

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
    if (!tokenListFilter) return setFilteredTokenList(tokenList.slice(0, 8))
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

  return (
    <Box flexDirection="column" height="fit" minHeight="full">
      <Box flexDirection="column" height="full" padding="6" gap="6">
        <Box flexDirection="row" alignItems="center" gap="4">
          <Text variant="large" fontWeight="bold" color="text80">
            Import Tokens
          </Text>

          <Select
            name="tokenNetwork"
            placeholder="Select Network"
            options={selectOptions}
            value={selectedNetwork?.chainId.toString()}
            onValueChange={value =>
              setSelectedNetwork(networks.find(n => n.chainId === Number(value)) || mainnetNetworks[0])
            }
          />
        </Box>

        <Box flexDirection="column" gap="2">
          <TextInput
            leftIcon={SearchIcon}
            value={tokenListFilter}
            placeholder="Search for a token"
            onChange={(ev: ChangeEvent<HTMLInputElement>) => setTokenListFilter(ev.target.value)}
          />

          <Button
            label={
              selectedNetwork
                ? `Import custom token list for ${' ' + selectedNetwork?.title}`
                : 'Select Network to import custom token list'
            }
            variant="text"
            onClick={selectedNetwork ? handleImportCustomTokenList : undefined}
          />
        </Box>

        <Box flexDirection="column">
          {filteredTokenList?.map((token, i) => {
            return (
              <Box
                key={i}
                flexDirection="row"
                alignItems="center"
                background={{ base: 'backgroundPrimary', hover: 'backgroundSecondary' }}
                onClick={() => {
                  toggleSelectToken(token.address)
                }}
                borderRadius="sm"
                padding="3"
                gap="4"
              >
                <Image src={token.logoURI} maxHeight="10" maxWidth="10" />
                <Text variant="normal" fontWeight="semibold" color="text80">
                  {token.symbol}
                </Text>
                <Box flexDirection="row" alignItems="center" marginLeft="auto" gap="2">
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
                        <Spinner size="md" marginRight="1" />
                      )}
                    </>
                  )}
                  <FilledRoundCheckBox
                    checked={(selectedTokens?.filter(t => t.address.includes(token.address)).length || 0) > 0}
                  />
                </Box>
              </Box>
            )
          })}
        </Box>

        <input
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {tokenListDate && (
          <Button
            label={`RESET LIST - last updated: ${tokenListDate?.toLocaleString()}`}
            variant="text"
            color="text50"
            onClick={async () => {
              const tokenData = await tokenStore.resetTokenList(selectedNetwork.chainId)
              setTokenList(tokenData.tokens)
              setTokenListDate(new Date(tokenData.date))
            }}
          />
        )}
      </Box>

      <Box marginTop="auto">
        <Box paddingX="6">
          {isAddingTokenManually && (
            <Box flexDirection="column" marginBottom="6" gap="0.5">
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
            </Box>
          )}

          {isFetchingTokenInfo && tokenManualAddress ? (
            <Box alignItems="center" marginBottom="6" justifyContent="center">
              <Spinner size="lg" />
            </Box>
          ) : (
            tokenInfo && (
              <Card flexDirection="column" marginBottom="6" gap="2">
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
        </Box>

        <Divider marginY="0" />

        <Box>
          <Box flexDirection="row" padding="6" gap="2">
            {isAddingTokenManually ? (
              <Button
                label="Hide"
                shape="square"
                disabled={!selectedNetwork}
                onClick={() => {
                  setIsAddingTokenManually(false)
                  setTokenManualAddress('')
                  setTokenInfo(undefined)
                }}
              />
            ) : (
              <Button
                label="Manual Import"
                shape="square"
                disabled={!selectedNetwork}
                onClick={() => {
                  setIsAddingTokenManually(true)
                }}
              />
            )}

            <Button label="Cancel" size="md" shape="square" marginLeft="auto" onClick={onClose} />

            <Button
              label="Add"
              variant="primary"
              shape="square"
              disabled={(!tokenInfo && !selectedTokens.length) || isAddingToken}
              onClick={() => {
                handleAdd()
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
