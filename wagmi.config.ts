import { http, createConfig } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
    chains: [arbitrumSepolia],
    connectors: [
        injected(),
    ],
    transports: {
        // Official Arbitrum Sepolia RPC
        [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc"),
    },
})
