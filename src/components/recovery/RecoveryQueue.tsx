import { Box, IconButton, RefreshIcon, Spinner, Text, NetworkImage, Button, VisibleIcon, HiddenIcon, Select } from "@0xsequence/design-system"
import { Sequence } from "@0xsequence/wallet-wdk"
import { QueuePayloadItem } from "./QueuePayloadItem"
import { getNetworkTitle } from "~/utils/network"
import { useState, useMemo } from "react"

type RecoveryQueueProps = {
       queuedPayloads: Sequence.QueuedRecoveryPayload[]
       isLoading: boolean
       refetch: () => void
}

function RecoveryQueue({ queuedPayloads, isLoading, refetch }: RecoveryQueueProps) {
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
	const chainOptions = useMemo(() => {
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
	}, [uniqueChains])

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
		<Box display="flex" flexDirection="column" gap="2">
			<Box alignItems="center" justifyContent="space-between">
				<Text variant="small" fontWeight="bold" color="text50">
					Recovery Payloads ({filteredPayloads.length} {filteredPayloads.length === 1 ? 'payload' : 'payloads'} {selectedChain !== "all" ? 'filtered' : 'queued'})
				</Text>

				<Box flexDirection="row" gap="2" alignItems="center">
					{uniqueChains.length > 1 && (
						<Select
							name="chain-filter"
							value={selectedChain}
							onValueChange={setSelectedChain}
							options={chainOptions}
						/>
					)}
					<Button
						variant="raised"
						shape="square"
						size="xs"
						label={executedHidden ? <Box flexDirection="row" gap="2" alignItems="center"><VisibleIcon /> Show Executed</Box> : <Box flexDirection="row" gap="2" alignItems="center"><HiddenIcon /> Hide Executed</Box>}
						onClick={() => setExecutedHidden(!executedHidden)}
					/>
					<IconButton
						icon={RefreshIcon}
						variant="raised"
						size="xs"
						onClick={() => refetch()}
					/>
				</Box>
			</Box>

			<Box style={{
				maxHeight: '700px',
				overflowY: 'auto',
				scrollbarWidth: 'thin',
				scrollbarColor: 'gray black',
			}} borderRadius="md">
				<Box display="flex" flexDirection="column" gap="2" background="backgroundSecondary" borderRadius="md" padding="2">
					{isLoading ? (
						<Box paddingY="10">
							<Text fontWeight="medium" color="text50" alignItems="center" justifyContent="center" display="flex" flexDirection="row" gap="2">
								<Spinner width="full" /> Loading queued recovery payloads...
							</Text>
						</Box>
					) : hasMultipleChainsInFiltered ? (
						// Display grouped by chain
						filteredUniqueChains.map((chainId) => (
							<Box key={chainId} display="flex" flexDirection="column" gap="2">
								<Box style={{
									position: "sticky",
									top: 8,
									left: 0,
									zIndex: 1,
								}} display="flex" flexDirection="row" alignItems="center" gap="2" paddingX="2" paddingY="1" backdropFilter="blur" background={"backgroundBackdrop"} borderRadius="md" >
									<NetworkImage chainId={chainId} size="sm" />
									<Text variant="normal" fontWeight="bold" color="text80">
										{getNetworkTitle(chainId)}
									</Text>
								</Box>
								<Box display="flex" flexDirection="column" gap="2">
									{filteredPayloadsByChain[chainId].map((payload) => (
										<QueuePayloadItem key={payload.id} payload={payload} executedHidden={executedHidden} />
									))}
								</Box>
							</Box>
						))
					) : (
						// Display without grouping if only one chain
						filteredPayloads.map((payload) => (
							<QueuePayloadItem key={payload.id} payload={payload} executedHidden={executedHidden} />
						))
					)}
				</Box>
			</Box>
              </Box>
       )
}

export default RecoveryQueue