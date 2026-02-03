import { Sequence } from "@0xsequence/wallet-wdk"
import { Card } from "@0xsequence/design-system"
import { useObservable, useStore } from "~/stores"
import { WalletStore } from "~/stores/WalletStore"
import PayloadDetailsCollapsible from "./PayloadDetailsCollapsible"
import ExecutionDetails from "./ExecutionDetails"
import { useFetchTokenMetadata } from "~/hooks/use-fetch-token-metadata"
import { parseCall } from "~/utils/transaction-parser"
import { useBalanceCheck } from "~/hooks/use-balance-check"
import { usePayloadExecution } from "~/hooks/use-payload-execution"
import { PayloadStatusBadge } from "./PayloadStatusBadge"
import { PayloadActionButton } from "./PayloadActionButton"
import { InsufficientBalanceMessage } from "./InsufficientBalanceMessage"

export function QueuePayloadItem({ payload, executedHidden = false }: { payload: Sequence.QueuedRecoveryPayload; executedHidden?: boolean }) {
	const walletStore = useStore(WalletStore)
	const selectedExternalProvider = useObservable(walletStore.selectedExternalProvider)

	const startDate = new Date(Number(payload.startTimestamp) * 1000)
	const endDate = new Date(Number(payload.endTimestamp) * 1000)
	const isLocked = endDate > new Date()

	// Parse calls to get transfer details
	// @ts-expect-error TODO calls is not part of the payload type but available at runtime
	const calls = payload.payload?.calls || []
	const parsedCalls = calls.map(parseCall)
	const transactionAmount = parsedCalls[0]?.amount
	const firstCall = parsedCalls[0]

	const tokenMetadata = useFetchTokenMetadata({
		parsedCalls: parsedCalls,
		chainId: payload.chainId,
	})

	const { hasEnoughBalance, balances, collectibles } = useBalanceCheck({
		firstCall,
		transactionAmount,
		chainId: payload.chainId
	})

	const {
		isExecuted,
		isPending,
		hash,
		status,
		opStatus,
		handleExecuteRecovery
	} = usePayloadExecution({
		payload,
		selectedExternalProvider
	})

	const readyToExecute = !isLocked && !!selectedExternalProvider && !isExecuted

	// Hide this item if executedHidden is true and the payload is executed
	if (executedHidden && isExecuted) {
		return null
	}

	return (
		<div className='flex flex-col gap-2 bg-background-muted border border-border-normal rounded-xl p-2'>
			<Card
				className='flex flex-row gap-3 p-4 bg-background-secondary rounded-md border-none'
				style={{ opacity: isExecuted ? 0.5 : 1, pointerEvents: isExecuted ? 'none' : 'auto' }}
			>
				<PayloadStatusBadge
					payloadId={payload.id}
					chainId={payload.chainId}
					isExecuted={isExecuted ?? false}
					startDate={startDate}
					endDate={endDate}
					isLocked={isLocked}
					readyToExecute={readyToExecute}
				/>

				<div className='ml-auto'>
					<PayloadActionButton
						isPending={isPending}
						hash={hash}
						status={status}
						opStatus={opStatus}
						isExecuted={isExecuted ?? false}
						isLocked={isLocked}
						readyToExecute={readyToExecute}
						hasEnoughBalance={hasEnoughBalance ?? false}
						selectedExternalProvider={selectedExternalProvider}
						chainId={payload.chainId}
						onExecute={handleExecuteRecovery}
					/>
				</div>
			</Card>

			{!hasEnoughBalance && !isExecuted && (
				<InsufficientBalanceMessage
					firstCall={firstCall}
					transactionAmount={transactionAmount}
					balances={balances}
					collectibles={collectibles}
					chainId={payload.chainId}
					tokenMetadata={tokenMetadata}
				/>
			)}

			{/* Show collapsible for non-executed items */}
			{parsedCalls.length > 0 && !isExecuted && (
				<PayloadDetailsCollapsible parsedCalls={parsedCalls} tokenMetadata={tokenMetadata} />
			)}

			{/* Show execution details for executed items */}
			{parsedCalls.length > 0 && isExecuted && (
				<ExecutionDetails parsedCalls={parsedCalls} tokenMetadata={tokenMetadata} />
			)}

		</div>
	)
}
