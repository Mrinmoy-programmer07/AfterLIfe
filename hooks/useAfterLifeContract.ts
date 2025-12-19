import { useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';

// @ts-ignore - JSON import
import AfterLifeArtifact from '../artifacts/contracts/AfterLife.sol/AfterLife.json';

// Multi-tenant contract on Arbitrum Sepolia
const CONTRACT_ADDRESS = "0x3935129b6270998d57E2A092C90987B44310d634";

export const useAfterLifeContract = () => {
    const { isConnected, chain, address: userAddress } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateNetwork = () => {
        if (!isConnected) throw new Error("Wallet not connected");
        if (chain?.id !== 421614) throw new Error("Please switch MetaMask to Arbitrum Sepolia (Chain ID: 421614)");
    };

    const handleTransaction = async (functionName: string, args: any[]) => {
        setIsLoading(true);
        setError(null);
        try {
            validateNetwork();

            console.log("-------------------------------------------");
            console.log(`Sending transaction: ${functionName}`);
            console.log("Args:", args);
            console.log("Contract:", CONTRACT_ADDRESS);
            console.log("-------------------------------------------");

            let hash;

            // Diagnostic: Try to simulate the call first to catch reverts explicitly
            if (publicClient && userAddress) {
                try {
                    const { request } = await publicClient.simulateContract({
                        address: CONTRACT_ADDRESS,
                        abi: AfterLifeArtifact.abi,
                        functionName,
                        args,
                        account: userAddress,
                        gas: BigInt(1000000),
                    });
                    console.log("Simulation successful!", request);

                    // Use the simulated request to write - guarantees same parameters & gas
                    hash = await writeContractAsync(request);
                } catch (simError: any) {
                    console.error("Simulation Failed:", simError);
                    throw new Error(`Simulation Failed: ${simError.shortMessage || simError.message}`);
                }
            } else {
                // Fallback if no public client (shouldn't happen given setup)
                hash = await writeContractAsync({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName,
                    args,
                    gas: BigInt(1000000),
                });
            }

            console.log("Transaction sent! Hash:", hash);

            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({ hash });

                if (receipt.status === 'reverted') {
                    throw new Error("Transaction reverted on-chain");
                }

                console.log("Transaction confirmed:", receipt.transactionHash);
                return receipt;
            } else {
                return { hash };
            }

        } catch (err: any) {
            console.error(`Error in ${functionName}:`, err);
            const message = err.shortMessage || err.message || "Transaction failed";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // --- Owner Functions ---

    const register = async (thresholdSeconds: number) => {
        return handleTransaction('register', [thresholdSeconds]);
    };

    const proveLife = async () => {
        return handleTransaction('proveLife', []);
    };

    const addGuardian = async (name: string, guardianAddress: string) => {
        return handleTransaction('addGuardian', [name, guardianAddress]);
    };

    const addBeneficiary = async (
        name: string,
        beneficiaryAddress: string,
        allocationBps: number,
        vestingType: number,
        duration: number
    ) => {
        return handleTransaction('addBeneficiary', [
            name,
            beneficiaryAddress,
            allocationBps,
            vestingType,
            duration
        ]);
    };

    const removeGuardian = async (guardianAddress: string) => {
        return handleTransaction('removeGuardian', [guardianAddress]);
    };

    const removeBeneficiary = async (beneficiaryAddress: string) => {
        return handleTransaction('removeBeneficiary', [beneficiaryAddress]);
    };

    const deposit = async (valueInWei: bigint) => {
        setIsLoading(true);
        try {
            validateNetwork();
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: AfterLifeArtifact.abi,
                functionName: 'deposit',
                args: [],
                value: valueInWei,
                gas: BigInt(100000),
            });
            if (publicClient) {
                return await publicClient.waitForTransactionReceipt({ hash });
            }
            return { hash };
        } finally {
            setIsLoading(false);
        }
    };

    // --- Guardian Functions ---

    const confirmInactivity = async (ownerAddress: string) => {
        return handleTransaction('confirmInactivity', [ownerAddress]);
    };

    // --- Beneficiary Functions ---

    const claim = async (ownerAddress: string) => {
        return handleTransaction('claim', [ownerAddress]);
    };

    // --- Data Fetching ---

    const getProtocolState = async (ownerAddress?: string) => {
        if (!publicClient) return null;
        const targetOwner = ownerAddress || userAddress;
        if (!targetOwner) return null;

        try {
            const protocol = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: AfterLifeArtifact.abi,
                functionName: 'protocols',
                args: [targetOwner],
                account: userAddress,
            }) as any;

            return {
                isRegistered: protocol[0] as boolean,
                lastHeartbeat: Number(protocol[1]) * 1000,
                inactivityThreshold: Number(protocol[2]) * 1000,
                isDead: protocol[3] as boolean,
                initialVaultBalance: protocol[4],
                vestingStartTime: Number(protocol[5]) * 1000,
                totalAllocation: Number(protocol[6]),
                deathDeclarationTime: Number(protocol[7]) * 1000,
            };
        } catch (e) {
            console.error("Error fetching protocol state:", e);
            return null;
        }
    };

    const getGuardians = async (ownerAddress?: string) => {
        if (!publicClient) return [];
        const targetOwner = ownerAddress || userAddress;
        if (!targetOwner) return [];

        try {
            const count = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: AfterLifeArtifact.abi,
                functionName: 'getGuardianCount',
                args: [targetOwner],
                account: userAddress,
            }) as bigint;

            const guardians: any[] = [];
            for (let i = 0; i < Number(count); i++) {
                const guardianAddr = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'getGuardianAt',
                    args: [targetOwner, BigInt(i)],
                    account: userAddress,
                }) as string;

                const details = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'guardians',
                    args: [targetOwner, guardianAddr],
                    account: userAddress,
                }) as any[];

                guardians.push({
                    id: guardianAddr,
                    name: details[0],
                    address: details[1],
                    isFixed: details[2]
                });
            }
            return guardians;
        } catch (e) {
            console.error("Error fetching guardians:", e);
            return [];
        }
    };

    const getBeneficiaries = async (ownerAddress?: string) => {
        if (!publicClient) return [];
        const targetOwner = ownerAddress || userAddress;
        if (!targetOwner) return [];

        try {
            const count = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: AfterLifeArtifact.abi,
                functionName: 'getBeneficiaryCount',
                args: [targetOwner],
                account: userAddress,
            }) as bigint;

            const beneficiaries: any[] = [];
            for (let i = 0; i < Number(count); i++) {
                const benAddr = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'getBeneficiaryAt',
                    args: [targetOwner, BigInt(i)],
                    account: userAddress,
                }) as string;

                const details = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'beneficiaries',
                    args: [targetOwner, benAddr],
                    account: userAddress,
                }) as any[];

                beneficiaries.push({
                    id: benAddr,
                    name: details[0],
                    address: details[1],
                    allocation: Number(details[2]),
                    amountClaimed: details[3],
                    vestingType: details[4] === 0 ? 'linear' : 'cliff',
                    vestingDuration: Number(details[5]),
                });
            }
            return beneficiaries;
        } catch (e) {
            console.error("Error fetching beneficiaries:", e);
            return [];
        }
    };

    const isOwner = async (address?: string) => {
        if (!publicClient) return false;
        const targetAddress = address || userAddress;
        if (!targetAddress) return false;

        try {
            const result = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: AfterLifeArtifact.abi,
                functionName: 'isOwner',
                args: [targetAddress],
                account: userAddress,
            });
            return result as boolean;
        } catch (e) {
            return false;
        }
    };

    return {
        isLoading,
        error,
        // Owner functions
        register,
        proveLife,
        addGuardian,
        addBeneficiary,
        removeGuardian,
        removeBeneficiary,
        deposit,
        // Guardian functions
        confirmInactivity,
        // Beneficiary functions
        claim,
        // Read functions
        getProtocolState,
        getGuardians,
        getBeneficiaries,
        isOwner,
        // Misc
        contractAddress: CONTRACT_ADDRESS,
        publicClient,
        userAddress
    };
};
