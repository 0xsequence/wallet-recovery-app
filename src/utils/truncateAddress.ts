import { Address } from "viem"

export const truncateAddress = (address: Address, start: number, end: number) => {
       return address.slice(0, start) + '...' + address.slice(-end)
}