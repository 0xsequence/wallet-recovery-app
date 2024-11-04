import {
  Box,
  Button,
  Divider,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  Text
} from '@0xsequence/design-system'
import { useNavigate } from 'react-router-dom'

import { useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

export default function SettingsDropdownMenu({ onTokenListClick }: { onTokenListClick: () => void }) {
  const authStore = useStore(AuthStore)

  const navigate = useNavigate()

  return (
    <DropdownMenuRoot>
      <Button as={DropdownMenuTrigger} label="Settings" variant="text" />
      <DropdownMenuContent side="bottom" align="end" sideOffset={20}>
        <Box marginTop="2">
          <DropdownMenuItem onClick={onTokenListClick}>
            <Box padding="1">
              <Text variant="normal" fontWeight="bold">
                Token List
              </Text>
            </Box>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Box width="16">
              <Divider color="white" />
            </Box>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              authStore.logout()
              navigate('/')
            }}
          >
            <Box padding="1">
              <Text variant="normal" fontWeight="bold">
                Log out
              </Text>
            </Box>
          </DropdownMenuItem>
        </Box>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  )
}