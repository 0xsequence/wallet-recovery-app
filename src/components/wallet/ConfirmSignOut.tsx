import { Button, Text } from '@0xsequence/design-system'

export default function ConfirmSignOut({ handleSignOut }: { handleSignOut: (signOut?: boolean) => void }) {
  return (
    <div className='flex flex-col p-6 gap-6'>
      <Text variant="large" fontWeight="bold" color="text100" className='mr-8'>
        Are you sure you want to sign out?
      </Text>
      <Text variant="normal" fontWeight="medium" color="text50">
        This will disconnect all Dapps, tokens, and relay wallet connections, and you’ll need to reconnect
        them manually.
      </Text>
      <div className='flex flex-row justify-end gap-2'>
        <Button size="md" shape="square" variant="primary" onClick={() => handleSignOut(true)}>
          Yes, sign out
        </Button>

        <Button size="md" shape="square" onClick={() => handleSignOut()}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
