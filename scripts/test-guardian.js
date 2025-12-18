const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Testing AfterLife contract with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // Deploy contract
    const AfterLife = await hre.ethers.getContractFactory("AfterLife");
    const afterlife = await AfterLife.deploy(30 * 24 * 60 * 60); // 30 days
    await afterlife.waitForDeployment();

    const contractAddress = await afterlife.getAddress();
    console.log("AfterLife deployed to:", contractAddress);
    console.log("Owner:", await afterlife.owner());

    // Try to add a guardian
    try {
        console.log("\n--- Testing addGuardian ---");
        const tx = await afterlife.addGuardian("Test Guardian", "0x9BcD23A9E62C84B5Ea38E062e889E37a4E6e487C");
        await tx.wait();
        console.log("✅ Guardian added successfully!");
    } catch (error) {
        console.error("❌ Error adding guardian:", error.message);
        if (error.data) {
            console.error("Revert reason:", error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
