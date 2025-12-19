import { http, createConfig, fallback } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
    chains: [arbitrumSepolia],
    connectors: [
        injected(), // This works with MetaMask without needing @metamask/sdk
    ],
    transports: {
        [arbitrumSepolia.id]: fallback([
            // More resilient public nodes
            http("https://arbitrum-sepolia.drpc.org"),
            http("https://arbitrum-sepolia-rpc.publicnode.com"),
            http("https://sepolia-rollup.arbitrum.io/rpc"),
            http("https://arbitrum-sepolia.rpc.thirdweb.com"),
        ]),
    },
})
