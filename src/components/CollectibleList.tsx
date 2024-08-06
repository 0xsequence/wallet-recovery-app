import { AddIcon, Box, Button, Card, Text } from '@0xsequence/design-system'
import { ContractType } from '@0xsequence/indexer'
import { useState } from 'react'

import { useStore } from '~/stores'
import { CollectibleStore } from '~/stores/CollectibleStore'

import ImportCollectible from './ImportCollectible'
import NetworkTag from './NetworkTag'

export default function CollectibleList() {
  const collectibleStore = useStore(CollectibleStore)

  const [isImportCollectibleViewOpen, setIsImportCollectibleViewOpen] = useState(false)

  return (
    <Box width="full" flexDirection="column" alignItems="center" justifyContent="center" marginBottom="4">
      {isImportCollectibleViewOpen && (
        <ImportCollectible onClose={() => setIsImportCollectibleViewOpen(false)} />
      )}
      <Button
        label="Import collectible"
        leftIcon={AddIcon}
        variant="primary"
        size="md"
        shape="square"
        onClick={() => {
          setIsImportCollectibleViewOpen(true)
        }}
      />
    </Box>
  )
}
