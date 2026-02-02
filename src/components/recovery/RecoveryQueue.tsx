import { IconButton, RefreshIcon, Spinner, Text, NetworkImage, Button, VisibleIcon, HiddenIcon, Select } from "@0xsequence/design-system"
import { Sequence } from "@0xsequence/wallet-wdk"
import { QueuePayloadItem } from "./QueuePayloadItem"
import { getNetworkTitle } from "~/utils/network"
import { useState, useMemo } from "react"

type RecoveryQueueProps = {
	queuedPayloads: Sequence.QueuedRecoveryPayload[]
	isLoading: boolean
	refetch: () => void
}

export function RecoveryQueue({ queuedPayloads, isLoading, refetch }: RecoveryQueueProps) {
	const [executedHidden, setExecutedHidden] = useState(true)
	const [selectedChain, setSelectedChain] = useState<string>("all")

	const payloadsByChain = queuedPayloads.reduce((acc, payload) => {
		const chainId = payload.chainId
		if (!acc[chainId]) {
			acc[chainId] = []
		}
		acc[chainId].push(payload)
		return acc
	}, {} as Record<number, Sequence.QueuedRecoveryPayload[]>)

	const uniqueChains = Object.keys(payloadsByChain).map(Number)

	// Create select options for chain filtering
/*	const chainOptions = useMemo(() => {
		const options = [
			{ value: "all", label: "All Chains" }
		]
		uniqueChains.forEach(chainId => {
			options.push({
				value: chainId.toString(),
				label: getNetworkTitle(chainId)
			})
		})
		return options
	}, [uniqueChains])*/

	// Filter payloads based on selected chain
	const filteredPayloads = useMemo(() => {
		if (selectedChain === "all") {
			return queuedPayloads
		}
		return queuedPayloads.filter(payload => payload.chainId.toString() === selectedChain)
	}, [queuedPayloads, selectedChain])

	const filteredPayloadsByChain = filteredPayloads.reduce((acc, payload) => {
		const chainId = payload.chainId
		if (!acc[chainId]) {
			acc[chainId] = []
		}
		acc[chainId].push(payload)
		return acc
	}, {} as Record<number, Sequence.QueuedRecoveryPayload[]>)

	const filteredUniqueChains = Object.keys(filteredPayloadsByChain).map(Number)
	const hasMultipleChainsInFiltered = filteredUniqueChains.length > 1

	return (
		<div className='flex flex-col gap-2'>
			<div className='flex flex-row items-center justify-between'>
				<Text variant="small" fontWeight="bold" color="text50">
					Recovery Payloads ({filteredPayloads.length} {filteredPayloads.length === 1 ? 'payload' : 'payloads'} {selectedChain !== "all" ? 'filtered' : 'queued'})
				</Text>

				<div className='flex flex-row gap-2 items-center'>
					{uniqueChains.length > 1 && (
						<Select
							name="chain-filter"
							value={selectedChain}
							onValueChange={setSelectedChain}
						/>
					)}
					<Button
						variant="emphasis"
						shape="square"
						size="xs"
						onClick={() => setExecutedHidden(!executedHidden)}
					>
						{executedHidden ? <div className='flex flex-row gap-2 items-center'><VisibleIcon /> Show Executed</div> : <div className='flex flex-row gap-2 items-center'><HiddenIcon /> Hide Executed</div>}
					</Button>
					<IconButton
						icon={RefreshIcon}
						variant="emphasis"
						size="xs"
						onClick={() => refetch()}
					/>
				</div>
			</div>

			<div
				className='max-h-700px overflow-y-auto scrollbar-thin scrollbar-color-gray-black rounded-md'
			>
				<div className='flex flex-col gap-2 bg-backgroundSecondary rounded-md p-2'>
					{isLoading ? (
						<div className='py-10'>
							<Text fontWeight="medium" color="text50" className='flex flex-row gap-2 items-center justify-center'>
								<Spinner /> Loading queued recovery payloads...
							</Text>
						</div>
					) : hasMultipleChainsInFiltered ? (
						// Display grouped by chain
						filteredUniqueChains.map((chainId) => (
							<div key={chainId} className='flex flex-col gap-2'>
								<div className='sticky top-8 left-0 z-10 flex flex-row gap-2 p-2 bg-backgroundBackdrop rounded-md'>
									<NetworkImage chainId={chainId} size="sm" />
									<Text variant="normal" fontWeight="bold" color="text80">
										{getNetworkTitle(chainId)}
									</Text>
								</div>
								<div className='flex flex-col gap-2'>
									{filteredPayloadsByChain[chainId].map((payload) => (
										<QueuePayloadItem key={payload.id} payload={payload} executedHidden={executedHidden} />
									))}
								</div>
							</div>
						))
					) : (
						// Display without grouping if only one chain
						filteredPayloads.map((payload) => (
							<QueuePayloadItem key={payload.id} payload={payload} executedHidden={executedHidden} />
						))
					)}
				</div>
			</div>
		</div>
	)
}

export default RecoveryQueue