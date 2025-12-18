const hre = require("hardhat");

async function main() {
    const contractAddress = "0x54bb6388E799B61468551291c0245F563541ADa6";
    const targetGuardian = "0x9BCD23A9e62C84B5ea38E062e889e37A4E6E487C";

    const AfterLife = await hre.ethers.getContractFactory("AfterLife");
    const contract = AfterLife.attach(contractAddress);

    console.log(`Checking guardian: ${targetGuardian}`);

    try {
        const guardian = await contract.guardians(targetGuardian);
        console.log("Guardian Data:", guardian);

        if (guardian.wallet && guardian.wallet !== "0x0000000000000000000000000000000000000000") {
            console.log("✅ Guardian EXISTS!");
        } else {
            console.log("❌ Guardian does NOT exist.");
        }

    } catch (error) {
        console.error("Error reading contract:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
