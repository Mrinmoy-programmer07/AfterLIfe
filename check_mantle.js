const { createPublicClient, http } = require('viem');
const { mantleSepoliaTestnet } = require('viem/chains');

// Artifact path
const AfterLifeArtifact = require('./artifacts/contracts/AfterLife.sol/AfterLife.json');

const CONTRACT_ADDRESS = "0x12e8CbbA13A6e74338FdE659B3B700E7ccecd694";
const USER_ADDRESS = "0xFE13B060897b5daBbC866C312A6839C007d181fB";

async function check() {
    console.log(`Checking registration for ${USER_ADDRESS} on Mantle Sepolia...`);
    const client = createPublicClient({
        chain: mantleSepoliaTestnet,
        transport: http("https://rpc.sepolia.mantle.xyz")
    });

    try {
        const isRegistered = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: AfterLifeArtifact.abi,
            functionName: 'isOwner',
            args: [USER_ADDRESS]
        });
        console.log(`RESULT: isRegistered = ${isRegistered}`);

        if (isRegistered) {
            const protocol = await client.readContract({
                address: CONTRACT_ADDRESS,
                abi: AfterLifeArtifact.abi,
                functionName: 'protocols',
                args: [USER_ADDRESS]
            });
            console.log(`Protocol Details:`, protocol);
        }
    } catch (err) {
        console.error(`Check Failed:`, err);
    }
}

check();
