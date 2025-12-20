const { createPublicClient, http } = require('viem');
const { mantleSepoliaTestnet } = require('viem/chains');

async function run() {
    const address = "0x12e8CbbA13A6e74338FdE659B3B700E7ccecd694";
    const abi = [
        {
            "inputs": [],
            "name": "MIN_THRESHOLD",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    const client = createPublicClient({
        chain: mantleSepoliaTestnet,
        transport: http("https://rpc.sepolia.mantle.xyz")
    });

    try {
        const minThreshold = await client.readContract({
            address,
            abi,
            functionName: 'MIN_THRESHOLD'
        });
        console.log(`ON-CHAIN MIN_THRESHOLD: ${minThreshold} seconds (${Number(minThreshold) / 86400} days)`);
    } catch (err) {
        console.error("Error reading MIN_THRESHOLD:", err.message);
    }
}

run();
