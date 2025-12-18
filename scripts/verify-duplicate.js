const hre = require("hardhat");

async function main() {
    const contractAddress = "0x54bb6388E799B61468551291c0245F563541ADa6";
    const targetGuardian = "0x9BCD23A9e62C84B5ea38E062e889e37A4E6E487C";

    const AfterLife = await hre.ethers.getContractFactory("AfterLife");
    const contract = AfterLife.attach(contractAddress);

    console.log(`--- Diagnostic Start ---`);

    // 1. Check Array Content (simulating frontend fetch)
    console.log("Reading guardianList...");
    let index = 0;
    try {
        while (true) {
            const addr = await contract.guardianList(index);
            console.log(`Index ${index}: ${addr}`);
            index++;
            if (index > 5) break; // Safety
        }
    } catch (e) {
        console.log(`Stopped iterating at index ${index} (End of list or error)`);
    }

    // 2. Check Specific Mapping
    const g = await contract.guardians(targetGuardian);
    console.log(`\nMapping Check for ${targetGuardian}:`);
    console.log(`Name: ${g.name}, Registered: ${g.wallet !== "0x0000000000000000000000000000000000000000"}`);

    // 3. Reproduce the Error
    console.log(`\n--- Attempting Duplicate Add ---`);
    console.log("Trying to add the same guardian again...");

    try {
        const tx = await contract.addGuardian("Duplicate Test", targetGuardian);
        await tx.wait();
        console.log("❌ Unexpected Success! (Should have reverted)");
    } catch (error) {
        console.log("\n✅ Expected Error Caught!");
        console.log("Error Message:", error.message);
        if (error.data) {
            console.log("Revert Data:", error.data);
            // Try to decode if possible, but usually message is enough in Hardhat
        }
        if (error.message.includes("Exists")) {
            console.log("\n>>> CONFIRMED: Revert reason is 'Exists' <<<");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
