import { useState, useEffect } from 'react';
import { ethers, Contract } from 'ethers';
import { useWallet } from './useWallet';

// Import the compiled contract ABI
// @ts-ignore - JSON import
import AfterLifeArtifact from '../artifacts/contracts/AfterLife.sol/AfterLife.json';

// Contract address - deployed on Arbitrum Sepolia
let CONTRACT_ADDRESS = "0x584D45746E694Dd11233020c000C0bc00c2bddfA";

// Try to load from deployment file if available
try {
    // @ts-ignore
    const deploymentInfo = require('../contract-address.json');
    if (deploymentInfo.address) {
        CONTRACT_ADDRESS = deploymentInfo.address;
    }
} catch (e) {
    console.log("Using hardcoded contract address");
}

export const useAfterLifeContract = () => {
    const { signer, isConnected, provider } = useWallet();
    const [contract, setContract] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initContract = async () => {
            if (!isConnected || !signer) {
                setContract(null);
                setError("Wallet not connected");
                return;
            }

            try {
                const instance = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    AfterLifeArtifact.abi,
                    signer
                );
                setContract(instance);
                console.log("Contract initialized at:", CONTRACT_ADDRESS);
            } catch (error) {
                console.error("Failed to initialize contract:", error);
            }
        } else {
            setContract(null);
    }
    }, [signer, isConnected]);

// Helper functions for common contract interactions
const addGuardian = async (name: string, address: string) => {
    if (!contract) throw new Error("Contract not initialized");
    setIsLoading(true);
    try {
        const tx = await contract.addGuardian(name, address);
        await tx.wait();
        console.log("Guardian added:", address);
        return tx;
    } catch (error) {
        console.error("Error adding guardian:", error);
        throw error;
    } finally {
        setIsLoading(false);
    }
};

const addBeneficiary = async (
    name: string,
    address: string,
    allocationBps: number,
    vestingType: number,
    duration: number
) => {
    if (!contract) throw new Error("Contract not initialized");
    setIsLoading(true);
    try {
        const tx = await contract.addBeneficiary(
            name,
            address,
            allocationBps,
            vestingType,
            duration
        );
        await tx.wait();
        console.log("Beneficiary added:", address);
        return tx;
    } catch (error) {
        console.error("Error adding beneficiary:", error);
        throw error;
    } finally {
        setIsLoading(false);
    }
};

const proveLife = async () => {
    if (!contract) throw new Error("Contract not initialized");
    setIsLoading(true);
    try {
        const tx = await contract.proveLife();
        await tx.wait();
        console.log("Life proved");
        return tx;
    } catch (error) {
        console.error("Error proving life:", error);
        throw error;
    } finally {
        setIsLoading(false);
    }
};

return {
    contract,
    isLoading,
    addGuardian,
    addBeneficiary,
    proveLife,
    contractAddress: CONTRACT_ADDRESS
};
};
