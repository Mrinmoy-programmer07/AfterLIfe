import { useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';

// @ts-ignore - JSON import
import AfterLifeArtifact from '../artifacts/contracts/AfterLife.sol/AfterLife.json';

// Arbitrum Sepolia contract address
const CONTRACT_ADDRESS = "0x447c6c1844694449bc0A32f52a8b7EEDb303b42A";

export const useAfterLifeContract = () => {
    const { isConnected, chain, address: userAddress } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();

    // Arbitrum Sepolia
    const activeChainId = chain?.id || 421614;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Core Transaction Handler (Ultra-Simple) ---
    const handleTransaction = async (functionName: string, args: any[], value?: bigint) => {
        setIsLoading(true);
        setError(null);

        try {
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: AfterLifeArtifact.abi,
                functionName,
                args,
                value,
            } as any);

            return await publicClient!.waitForTransactionReceipt({ hash });
        } catch (err: any) {
            const msg = err.shortMessage || err.message || "Transaction failed";
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // --- Owner Functions ---

    const register = async (thresholdSeconds: number) => {
        return handleTransaction('register', [BigInt(thresholdSeconds)]);
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
            BigInt(allocationBps),
            vestingType,
            BigInt(duration)
        ]);
    };

    const removeGuardian = async (guardianAddress: string) => {
        return handleTransaction('removeGuardian', [guardianAddress]);
    };

    const removeBeneficiary = async (beneficiaryAddress: string) => {
        return handleTransaction('removeBeneficiary', [beneficiaryAddress]);
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
            } as any) as any;

            const currentBalance = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: AfterLifeArtifact.abi,
                functionName: 'getOwnerBalance',
                args: [targetOwner],
                account: userAddress,
            } as any) as bigint;

            return {
                isRegistered: protocol[0] as boolean,
                lastHeartbeat: Number(protocol[1]) * 1000,
                inactivityThreshold: Number(protocol[2]) * 1000,
                isDead: protocol[3] as boolean,
                initialVaultBalance: protocol[4],
                currentVaultBalance: currentBalance,
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
            } as any) as bigint;

            const guardians: any[] = [];
            for (let i = 0; i < Number(count); i++) {
                const guardianAddr = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'getGuardianAt',
                    args: [targetOwner, BigInt(i)],
                    account: userAddress,
                } as any) as string;

                const details = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'guardians',
                    args: [targetOwner, guardianAddr],
                    account: userAddress,
                } as any) as any[];

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
            } as any) as bigint;

            const beneficiaries: any[] = [];
            for (let i = 0; i < Number(count); i++) {
                const benAddr = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'getBeneficiaryAt',
                    args: [targetOwner, BigInt(i)],
                    account: userAddress,
                } as any) as string;

                const details = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: AfterLifeArtifact.abi,
                    functionName: 'beneficiaries',
                    args: [targetOwner, benAddr],
                    account: userAddress,
                } as any) as any[];

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
            } as any);
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
