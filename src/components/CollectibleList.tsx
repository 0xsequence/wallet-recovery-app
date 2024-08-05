import { AddIcon, Box, Button, Card, Text } from '@0xsequence/design-system'
import { ContractType } from '@0xsequence/indexer'
import { useState } from 'react'

import { useStore } from '~/stores'
import { CollectibleStore } from '~/stores/CollectibleStore'

import NetworkTag from './NetworkTag'

export default function CollectibleList() {
  const collectibleStore = useStore(CollectibleStore)

  const [isImportCollectibleViewOpen, setIsImportCollectibleViewOpen] = useState(false)

  return (
    <Box width="full">
      <Box width="full" alignItems="center" justifyContent="center" marginBottom="4">
        <Button
          label="Import collectible"
          leftIcon={AddIcon}
          variant="primary"
          size="md"
          shape="square"
          onClick={() => {
            // setIsImportCollectibleViewOpen(true)
            // collectibleStore.addUserCollectible({
            //   chainId: 137,
            //   address: '0xEa60ee451eEdE8A32C0d09Aa01493670C9f9EA1c',
            //   contractType: ContractType.ERC721,
            //   tokenId: 0
            // })
          }}
        />
      </Box>
    </Box>
  )
}
