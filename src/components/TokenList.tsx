import { Box, Button, Card, Text } from '@0xsequence/design-system'

import { useObservable, useStore } from '~/stores'
import { TokenStore } from '~/stores/TokenStore'

import NetworkTag from './NetworkTag'

export default function TokenList() {
  const tokenStore = useStore(TokenStore)
  const userAddedTokens = useObservable(tokenStore.userAddedTokens)

  return (
    <Box
      flexDirection="column"
      paddingY="4"
      paddingX="8"
      background="backgroundPrimary"
      width="full"
      height="full"
      alignItems="center"
    >
      <Box flexDirection="column" alignItems="center" gap="4" marginBottom="4">
        <Text variant="large" color="text80">
          Token List
        </Text>
        <Text variant="normal" color="text50">
          Tokens added by you can be removed here
        </Text>
      </Box>

      <Box width="full" height="full" flexDirection="column" marginTop="4" paddingBottom="12" gap="4">
        {userAddedTokens.length === 0 && (
          <Box height="full" alignItems="center" justifyContent="center">
            <Text variant="medium" color="text50" marginBottom="16">
              You haven't added any tokens yet
            </Text>
          </Box>
        )}
        {userAddedTokens.map((token, i) => (
          <Card key={i} width="full" flexDirection="row" gap="2" alignItems="center">
            <Box flexDirection="column" gap="2">
              <Text variant="medium" color="text80">
                {token.symbol}
              </Text>
              <Text variant="normal" color="text50">
                {token.address}
              </Text>
              <NetworkTag chainId={token.chainId} />
            </Box>
            <Box marginLeft="auto">
              <Button
                label="Remove"
                variant="danger"
                size="md"
                shape="square"
                onClick={() => {
                  tokenStore.removeToken(token)
                }}
              />
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
