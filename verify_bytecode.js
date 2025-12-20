const { createPublicClient, http } = require('viem');
const { arbitrumSepolia, mantleSepoliaTestnet } = require('viem/chains');

async function checkBytecode(chainId, name, rpc, address) {
    console.log(`Checking ${name} (${chainId}) at ${address}...`);
    const client = createPublicClient({
        transport: http(rpc)
    });

    try {
        const bytecode = await client.getBytecode({ address });
        if (!bytecode || bytecode === '0x') {
            console.log(`❌ FAILED: No bytecode found at ${address} on ${name}. Is it deployed?`);
        } else {
            console.log(`✅ SUCCESS: Bytecode found (${bytecode.length / 2 - 1} bytes)`);
        }
    } catch (err) {
        console.error(`❌ ERROR checking ${name}:`, err.message);
    }
}

async function run() {
    await checkBytecode(421614, "Arbitrum Sepolia", "https://magical-bitter-bush.arbitrum-sepolia.quiknode.pro/d2853cfaf1e94d1f92620acb8e05688c362730f8", "0xAc11eedfc08B68997B66a09fa18cAd89BcF7681e");
    await checkBytecode(5003, "Mantle Sepolia", "https://rpc.sepolia.mantle.xyz", "0x12e8CbbA13A6e74338FdE659B3B700E7ccecd694");
}

run();
