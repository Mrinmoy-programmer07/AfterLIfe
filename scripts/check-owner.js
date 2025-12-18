const hre = require("hardhat");

async function main() {
    const contractAddress = "0x54bb6388E799B61468551291c0245F563541ADa6";
    const AfterLife = await hre.ethers.getContractFactory("AfterLife");
    const contract = AfterLife.attach(contractAddress);

    console.log("Checking contract at:", contractAddress);

    try {
        const owner = await contract.owner();
        console.log("Owner:", owner);

        const isDead = await contract.isDead();
        console.log("isDead:", isDead);

        const threshold = await contract.inactivityThreshold();
        console.log("Inactivity Threshold:", threshold.toString());

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
