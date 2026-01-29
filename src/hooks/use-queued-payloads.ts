import { useObservable, useStore } from '~/stores'
import { QueuedPayloadsStore } from '~/stores/QueuedPayloadsStore'

/**
 * Hook to access queued recovery payloads from the store.
 * 
 * @returns Object containing payloads array, loading state, and refetch function
 */
export function useQueuedPayloads() {
  const queuedPayloadsStore = useStore(QueuedPayloadsStore)
  const payloads = useObservable(queuedPayloadsStore.payloads)
  const isLoading = useObservable(queuedPayloadsStore.isLoading)
  
  return {
    payloads,
    isLoading,
    refetch: queuedPayloadsStore.refetch
  }
}
