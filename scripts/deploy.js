const hre = require("hardhat");

async function main() {
    // Multi-tenant: No constructor args, users register via register() function
    console.log("Deploying AfterLife (Multi-Tenant) contract...");

    const AfterLife = await hre.ethers.getContractFactory("AfterLife");
    const afterLife = await AfterLife.deploy();

    await afterLife.waitForDeployment();

    const address = await afterLife.getAddress();
    console.log(`AfterLife deployed to: ${address}`);

    // Save the address for frontend use
    const fs = require('fs');
    const deploymentInfo = {
        address: address,
        deployedAt: new Date().toISOString(),
        network: hre.network.name
    };

    fs.writeFileSync(
        './contract-address.json',
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Deployment info saved to contract-address.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
