const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x1B41eD3F6DdAE9C7534573cC863d1eD114fAC890";
    console.log("Testing proveLife on:", CONTRACT_ADDRESS);

    const AfterLife = await hre.ethers.getContractFactory("AfterLife");
    const contract = AfterLife.attach(CONTRACT_ADDRESS);

    // Get signer (should be the owner)
    const [signer] = await hre.ethers.getSigners();
    console.log("Signer:", signer.address);

    const owner = await contract.owner();
    console.log("Contract Owner:", owner);

    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.error("Owner mismatch! Signer is not owner.");
        return;
    }

    console.log("Sending proveLife tx...");
    try {
        const tx = await contract.connect(signer).proveLife();
        console.log("Tx sent:", tx.hash);
        await tx.wait();
        console.log("Tx confirmed!");
    } catch (error) {
        console.error("Tx Failed:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
