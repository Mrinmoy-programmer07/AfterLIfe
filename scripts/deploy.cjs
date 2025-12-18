const hre = require("hardhat");

async function main() {
    const INACTIVITY_THRESHOLD = 30 * 24 * 60 * 60; // 30 Days

    const afterLife = await hre.ethers.deployContract("AfterLife", [INACTIVITY_THRESHOLD]);

    await afterLife.waitForDeployment();

    console.log(`AfterLife deployed to: ${afterLife.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
