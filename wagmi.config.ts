import { http, createConfig, fallback } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
    chains: [arbitrumSepolia],
    connectors: [
        injected(), // This works with MetaMask without needing @metamask/sdk
    ],
    transports: {
        [arbitrumSepolia.id]: http("/api/rpc"),
    },
})
