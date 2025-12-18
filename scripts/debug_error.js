const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x1B41eD3F6DdAE9C7534573cC863d1eD114fAC890";
    const AfterLife = await hre.ethers.getContractFactory("AfterLife");
    const contract = AfterLife.attach(CONTRACT_ADDRESS);

    console.log("Checking Contract:", CONTRACT_ADDRESS);

    try {
        const owner = await contract.owner();
        console.log("Contract Owner:", owner);

        const sender = "0xFE13B060897b5daBbC866C312A6839C007d181fB";
        console.log("User Sender:   ", sender);
        console.log("Is Owner?", owner.toLowerCase() === sender.toLowerCase());

        const guardianAddr = "0x9BCD23A9e62C84B5ea38E062e889e37A4E6E487C";
        const guardian = await contract.guardians(guardianAddr);
        console.log("Guardian Status for", guardianAddr, ":");
        console.log("  Name:", guardian.name);
        console.log("  Wallet:", guardian.wallet);
        console.log("  Is Fixed:", guardian.isFixed);

        if (guardian.wallet !== "0x0000000000000000000000000000000000000000") {
            console.log("CONCLUSION: Guardian ALREADY EXISTS. Adding again will fail.");
        } else {
            console.log("CONCLUSION: Guardian does not exist.");
        }

    } catch (e) {
        console.error("Error reading contract:", e);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
