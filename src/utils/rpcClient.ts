import { createPublicClient, http, type PublicClient } from 'viem'

// Public recovery RPCs are flaky; cap viem's default 3 retries and keep a bounded
// timeout so a single stalling endpoint can't hold the recovery flow for ~30s+.
export function makeRpcClient(rpcUrl: string): PublicClient {
  return createPublicClient({ transport: http(rpcUrl, { retryCount: 1, timeout: 10_000 }) })
}
