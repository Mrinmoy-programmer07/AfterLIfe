require('dotenv').config();
const hre = require("hardhat");

async function main() {
    const contractAddress = "0x54bb6388E799B61468551291c0245F563541ADa6";
    const [deployer] = await hre.ethers.getSigners();
    console.log("Using account:", deployer.address);

    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance));

    const AfterLife = await hre.ethers.getContractFactory("AfterLife");
    const contract = AfterLife.attach(contractAddress);

    // 1. Check Owner again
    const owner = await contract.owner();
    console.log("Contract owner:", owner);

    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.error("❌ Mismatch! You are not the owner.");
        return;
    }

    // 2. Try Simple Write: proveLife()
    console.log("\nAttempting `proveLife()`...");
    try {
        // Manually setting gas limit to be safe
        const tx = await contract.proveLife({ gasLimit: 500000 });
        console.log("proveLife TX sent:", tx.hash);
        await tx.wait();
        console.log("✅ proveLife Confirmed!");
    } catch (e) {
        console.error("❌ proveLife Failed:", e.message);
        if (e.data) console.error("Revert data:", e.data);
    }

    // 3. Try Complex Write: addGuardian()
    console.log("\nAttempting `addGuardian`...");
    try {
        const randomAddr = hre.ethers.Wallet.createRandom().address;
        console.log("Adding random guardian:", randomAddr);
        const tx = await contract.addGuardian("Test Guardian", randomAddr, { gasLimit: 1000000 });
        console.log("addGuardian TX sent:", tx.hash);
        await tx.wait();
        console.log("✅ addGuardian Confirmed!");
    } catch (e) {
        console.error("❌ addGuardian Failed:", e.message);
        if (e.data) console.error("Revert data:", e.data);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
