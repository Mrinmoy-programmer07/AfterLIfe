import { useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';

// @ts-ignore - JSON import
import AfterLifeArtifact from '../artifacts/contracts/AfterLife.sol/AfterLife.json';

// Multi-chain contract addresses
const CONTRACT_ADDRESSES: { [key: number]: string } = {
    421614: "0xAc11eedfc08B68997B66a09fa18cAd89BcF7681e", // Arbitrum Sepolia
    5003: "0x12e8CbbA13A6e74338FdE659B3B700E7ccecd694",   // Mantle Sepolia
};

export const useAfterLifeContract = () => {
    const { isConnected, chain, address: userAddress } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();

    // Dynamically select address based on chain, default to Arbitrum if unknown
    const activeChainId = chain?.id || 421614;
    const CONTRACT_ADDRESS = (CONTRACT_ADDRESSES[activeChainId] || CONTRACT_ADDRESSES[421614]) as `0x${string}`;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateNetwork = () => {
        if (!isConnected) throw new Error("Wallet not connected");
        if (chain?.id !== 421614 && chain?.id !== 5003) {
            throw new Error("Please switch to Arbitrum Sepolia or Mantle Sepolia");
        }
    };

    // --- Core Transaction Handler (Minimalist Refactor) ---
    const handleTransaction = async (
        functionName: string,
        args: any[],
        value?: bigint
    ) => {
        if (!writeContractAsync || !publicClient) {
            throw new Error("Contract system not initialized or wallet not connected.");
        }

        setIsLoading(true);
        setError(null);

        try {
            validateNetwork();
            console.log(`[handleTransaction] >>> INITIALIZING: ${functionName}`);
            console.log(`[handleTransaction] Args:`, JSON.stringify(args, (_, v) => typeof v === 'bigint' ? v.toString() : v));

            const txParams: any = {
                address: CONTRACT_ADDRESS,
                abi: AfterLifeArtifact.abi,
                functionName,
                args,
            };

            // Applying baseline gas limits to bypass problematic estimation phases
            if (activeChainId === 5003) {
                console.log(`[handleTransaction] Applying Mantle gas limit (10M).`);
                txParams.gas = BigInt(10000000);
            } else {
                console.log(`[handleTransaction] Applying Arbitrum baseline gas limit (3M).`);
                txParams.gas = BigInt(3000000);
            }

            if (value && value > 0n) {
                txParams.value = value;
            }

            // Step 1: Handshake
            console.log(`[handleTransaction] >>> TRIGGERING METAMASK HANDSHAKE...`);
            const hash = await writeContractAsync(txParams);
            console.log(`[handleTransaction] HASH RECEIVED: ${hash}`);

            // Step 2: Confirmation
            console.log(`[handleTransaction] Awaiting block confirmation...`);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            if (receipt.status === 'reverted') {
                throw new Error(`Transaction reverted on-chain. Hash: ${hash}`);
            }

            console.log(`[handleTransaction] SUCCESS! Confirmed in hash: ${receipt.transactionHash}`);
            return receipt;

        } catch (err: any) {
            console.error(`[handleTransaction] CRITICAL FAILURE in ${functionName}:`, err);
            setError(err.message || String(err));
            throw err;
        } finally {
            setIsLoading(false);
            console.log(`[handleTransaction] <<< FINALIZED: ${functionName}`);
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
        console.log(`[useAfterLifeContract] removeGuardian EXECUTING for: ${guardianAddress}`);
        return handleTransaction('removeGuardian', [guardianAddress]);
    };

    const removeBeneficiary = async (beneficiaryAddress: string) => {
        console.log(`[useAfterLifeContract] removeBeneficiary EXECUTING for: ${beneficiaryAddress}`);
        return handleTransaction('removeBeneficiary', [beneficiaryAddress]);
    };

    const deposit = async (valueInWei: bigint) => {
        return handleTransaction('deposit', [], valueInWei);
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
