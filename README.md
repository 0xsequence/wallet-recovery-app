# Sequence Recovery Wallet
Sequence Recovery Wallet is a secure, self-custodial solution that allows [Sequence Universal Wallet](https://sequence.app) users to regain access to their wallets with no third-party dependencies. Recovery Wallet can be run locally using the instructions below and it doesn't depend on Sequence infrastructure to be available. Sequence Universal Wallet session states are stored on-chain, using the [Arweave permanent decentralized storage layer](https://arweave.org/), ensuring transparency and trust.

## Prerequisites

1. Create a recovery key to your wallet at https://sequence.app/settings/recovery

## Running Locally

1. Install [pnpm](https://pnpm.io)
2. `pnpm i`
3. `pnpm dev`
4. Visit http://localhost:5173

## Deploying

1. `pnpm predeploy`
2. `pnpm run deploy`
