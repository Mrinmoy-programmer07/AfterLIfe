import { http, createConfig } from 'wagmi'
import { arbitrumSepolia, mantleSepoliaTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
    chains: [arbitrumSepolia, mantleSepoliaTestnet],
    connectors: [
        injected(),
    ],
    transports: {
        // High-performance Public RPC
        [arbitrumSepolia.id]: http("https://arbitrum-sepolia.drpc.org"),

        // Standard Mantle RPC
        [mantleSepoliaTestnet.id]: http("https://rpc.sepolia.mantle.xyz"),
    },
})
