import { useState } from 'react';
import { useAccount, useWriteContract, usePublicClient, useSwitchChain } from 'wagmi';

// Import the compiled contract ABI
// @ts-ignore - JSON import
import AfterLifeArtifact from '../artifacts/contracts/AfterLife.sol/AfterLife.json';

// Deployed on Arbitrum Sepolia
const CONTRACT_ADDRESS = "0x1B41eD3F6DdAE9C7534573cC863d1eD114fAC890";

export const useAfterLifeContract = () => {
    const { isConnected, chain } = useAccount();
    const { switchChainAsync } = useSwitchChain();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateNetwork = async () => {
        if (!isConnected) throw new Error("Wallet not connected");
        if (chain?.id !== 421614) {
            try {
                await switchChainAsync({ chainId: 421614 });
            } catch (e) {
                throw new Error("Please switch MetaMask to Arbitrum Sepolia (Chain ID: 421614)");
            }
        }
    };

    const handleTransaction = async (functionName: string, args: any[]) => {
        setIsLoading(true);
        setError(null);
        try {
            await validateNetwork();

            console.log("-------------------------------------------");
            console.log(`Sending transaction: ${functionName}`);
            console.log("Args:", args);
            console.log("Contract:", CONTRACT_ADDRESS);
            // @ts-ignore
            console.log("Sender:", isConnected ? chain.id : "Not Connected");
            console.log("-------------------------------------------");

            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: AfterLifeArtifact.abi,
                functionName,
                args,
            });

            console.log("Transaction sent! Hash:", hash);

            // Wait for confirmation
            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                console.log("Transaction confirmed:", receipt.transactionHash);
                return receipt;
            } else {
                return { hash }; // Fallback if public client missing
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

    // Helper functions
    const addGuardian = async (name: string, guardianAddress: string) => {
        return handleTransaction('addGuardian', [name, guardianAddress]);
    };

    const removeGuardian = async (guardianAddress: string) => {
        return handleTransaction('removeGuardian', [guardianAddress]);
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

    const removeBeneficiary = async (beneficiaryAddress: string) => {
        return handleTransaction('removeBeneficiary', [beneficiaryAddress]);
    };

    const proveLife = async () => {
        return handleTransaction('proveLife', []);
    };

    // Data Fetching
    const getGuardians = async () => {
        if (!publicClient) return [];
        const guardians: any[] = [];
        let index = 0;

        try {
            while (true) {
                try {
                    // 1. Get address at index
                    const guardianAddress = await publicClient.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: AfterLifeArtifact.abi,
                        functionName: 'guardianList',
                        args: [BigInt(index)],
                    }) as string;

                    // 2. Get details for this address
                    const details = await publicClient.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: AfterLifeArtifact.abi,
                        functionName: 'guardians',
                        args: [guardianAddress],
                    }) as any[];
                    // details structure: [name, wallet, isFixed]

                    guardians.push({
                        id: guardianAddress,
                        name: details[0],
                        address: details[1], // or guardianAddress
                        isFixed: details[2]
                    });

                    index++;
                    // Safety break for MVP
                    if (index > 20) break;
                } catch (err) {
                    // Likely index out of bounds, stop loop
                    break;
                }
            }
        } catch (e) {
            console.error("Error fetching guardians:", e);
        }
        return guardians;
    };

    const getBeneficiaries = async () => {
        if (!publicClient) return [];
        const beneficiaries: any[] = [];
        let index = 0;

        try {
            while (true) {
                try {
                    const beneficiaryAddress = await publicClient.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: AfterLifeArtifact.abi,
                        functionName: 'beneficiaryList',
                        args: [BigInt(index)],
                    }) as string;

                    const details = await publicClient.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: AfterLifeArtifact.abi,
                        functionName: 'beneficiaries',
                        args: [beneficiaryAddress],
                    }) as any[];
                    // Struct: name, wallet, allocation, amountClaimed, vestingType, vestingDuration

                    beneficiaries.push({
                        id: beneficiaryAddress,
                        name: details[0],
                        address: details[1],
                        allocation: Number(details[2]),
                        amountClaimed: details[3],
                        vestingType: details[4] === 0 ? 'linear' : 'cliff', // Enum mapping
                        vestingDuration: Number(details[5]), // Seconds
                        createdAt: Date.now() // Mock for UI sort if needed
                    });

                    index++;
                    if (index > 20) break;
                } catch (err) {
                    break;
                }
            }
        } catch (e) {
            console.error("Error fetching beneficiaries:", e);
        }
        return beneficiaries;
    };

    const getProtocolState = async () => {
        if (!publicClient) return null;
        try {
            const [owner, lastHeartbeat, inactivityThreshold, isDead] = await Promise.all([
                publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'owner',
                }),
                publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'lastHeartbeat',
                }),
                publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'inactivityThreshold',
                }),
                publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'isDead',
                }),
            ]);

            return {
                owner: owner as string,
                lastHeartbeat: Number(lastHeartbeat) * 1000, // Convert to ms for JS
                inactivityThreshold: Number(inactivityThreshold) * 1000, // Convert to ms
                isDead: isDead as boolean
            };
        } catch (e) {
            console.error("Error fetching protocol state:", e);
            return null;
        }
    };

    return {
        isLoading,
        error,
        addGuardian,
        removeGuardian,
        addBeneficiary,
        removeBeneficiary,
        proveLife,
        getGuardians,
        getBeneficiaries,
        getProtocolState,
        contractAddress: CONTRACT_ADDRESS,
        publicClient
    };
};
