import { http, createConfig, fallback } from 'wagmi'
import { arbitrumSepolia, mantleSepoliaTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
    chains: [arbitrumSepolia, mantleSepoliaTestnet],
    connectors: [
        injected(), // This works with MetaMask without needing @metamask/sdk
    ],
    transports: {
        [arbitrumSepolia.id]: fallback([
            // Private QuickNode RPC (Primary)
            http("https://magical-bitter-bush.arbitrum-sepolia.quiknode.pro/d2853cfaf1e94d1f92620acb8e05688c362730f8"),
            // More resilient public nodes
            http("https://arbitrum-sepolia.drpc.org"),
            http("https://arbitrum-sepolia-rpc.publicnode.com"),
            http("https://sepolia-rollup.arbitrum.io/rpc"),
            http("https://arbitrum-sepolia.rpc.thirdweb.com"),
            http("https://arbitrum-sepolia.blockpi.network/v1/rpc/public"),
            http("https://endpoints.omniatech.io/v1/arbitrum/sepolia/public"),
            http("https://rpc.ankr.com/arbitrum_sepolia"),
        ]),
        [mantleSepoliaTestnet.id]: fallback([
            http("https://rpc.sepolia.mantle.xyz"),
            http("https://mantle-sepolia.drpc.org"),
            http("https://check-rpc.mantle.xyz"), // Mantle's health check/alt RPC
            http("https://rpc-sepolia.mantle.xyz"), // Alternate DNS
        ]),
    },
})
