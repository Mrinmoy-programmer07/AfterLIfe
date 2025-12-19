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
        console.log("[useAfterLifeContract] Validating network...");
        if (!isConnected) {
            console.error("[useAfterLifeContract] Error: Wallet not connected");
            throw new Error("Wallet not connected");
        }
        console.log("[useAfterLifeContract] Connection confirmed:", userAddress);
        console.log("[useAfterLifeContract] Chain ID:", chain?.id);

        if (chain?.id !== 421614) {
            console.error("[useAfterLifeContract] Error: Wrong network. Target: 421614");
            throw new Error("Please switch MetaMask to Arbitrum Sepolia (Chain ID: 421614)");
        }
        console.log("[useAfterLifeContract] Network validation complete.");
    };

    const handleTransaction = async (functionName: string, args: any[], value?: bigint) => {
        setIsLoading(true);
        setError(null);
        console.log(`[handleTransaction] >>> INITIALIZING: ${functionName}`);

        try {
            validateNetwork();

            console.log("-------------------------------------------");
            console.log(`[handleTransaction] PROCLAIM: ${functionName}`);
            console.log(`[handleTransaction] Args:`, JSON.stringify(args));
            console.log(`[handleTransaction] Value:`, value?.toString() || "0");
            console.log(`[handleTransaction] Contract:`, CONTRACT_ADDRESS);
            console.log("-------------------------------------------");

            let hash;

            // Optional Simulation
            let simulatedRequest = null;
            if (publicClient && userAddress) {
                console.log(`[handleTransaction] Attempting simulation for ${functionName}...`);
                try {
                    const { request } = await publicClient.simulateContract({
                        address: CONTRACT_ADDRESS,
                        abi: AfterLifeArtifact.abi,
                        functionName,
                        args,
                        account: userAddress,
                        value: value,
                        gas: BigInt(1000000),
                    });
                    simulatedRequest = request;
                    console.log(`[handleTransaction] Simulation SUCCESS for ${functionName}`);
                } catch (simError: any) {
                    const errorMsg = (simError.message || "").toLowerCase();
                    console.warn(`[handleTransaction] Simulation REVERTED/FAILED: ${errorMsg}`);

                    const shouldBypassSimulation =
                        errorMsg.includes('rate limit') ||
                        errorMsg.includes('too many requests') ||
                        errorMsg.includes('failed to fetch') ||
                        errorMsg.includes('fetch failed') ||
                        errorMsg.includes('network error') ||
                        errorMsg.includes('internal json-rpc error') ||
                        errorMsg.includes('json-rpc error') ||
                        errorMsg.includes('reverted');

                    if (shouldBypassSimulation) {
                        console.warn(`[handleTransaction] BYPASSING simulation for ${functionName} (RPC issue)`);
                    } else {
                        console.error(`[handleTransaction] FATAL Simulation Error:`, simError);
                        throw new Error(`Simulation Failed: ${simError.shortMessage || simError.message}`);
                    }
                }
            }

            // Execute Transaction
            console.log(`[handleTransaction] >>> TRIGGERING MetaMask Handshake for ${functionName}...`);
            try {
                if (simulatedRequest) {
                    console.log(`[handleTransaction] Using simulated request`);
                    hash = await writeContractAsync(simulatedRequest);
                } else {
                    // Force path to catch block below to handle direct write
                    throw new Error("SKIP_SIMULATION");
                }
            } catch (writeErr: any) {
                const writeErrorMsg = (writeErr.message || "").toLowerCase();
                const isRpcError =
                    writeErrorMsg.includes('internal json-rpc error') ||
                    writeErrorMsg.includes('json-rpc error') ||
                    writeErrorMsg.includes('internal error') ||
                    writeErrorMsg.includes('SKIP_SIMULATION');

                if (isRpcError) {
                    console.warn(`[handleTransaction] ${writeErrorMsg === 'skip_simulation' ? 'Bypassing simulation' : 'Simulated write failed with RPC error'}. Attempting direct write (fallback)...`);
                    hash = await writeContractAsync({
                        address: CONTRACT_ADDRESS,
                        abi: AfterLifeArtifact.abi,
                        functionName,
                        args,
                        value: value,
                        account: userAddress,
                        chain: chain || undefined,
                        gas: BigInt(1000000),
                    } as any);
                } else {
                    console.error(`[handleTransaction] Fatal Write Error:`, writeErr);
                    throw writeErr;
                }
            }

            console.log(`[handleTransaction] HASH RECEIVED: ${hash}`);

            if (publicClient) {
                console.log(`[handleTransaction] Awaiting block confirmation for ${hash}...`);
                const receipt = await publicClient.waitForTransactionReceipt({ hash });

                if (receipt.status === 'reverted') {
                    console.error(`[handleTransaction] TRANSACTION REVERTED ON-CHAIN: ${hash}`);
                    throw new Error("Transaction reverted on-chain");
                }

                console.log(`[handleTransaction] SUCCESS! Confirmed in hash: ${receipt.transactionHash}`);
                return receipt;
            } else {
                console.warn(`[handleTransaction] publicClient missing, returning hash only.`);
                return { hash };
            }
        } catch (err: any) {
            console.error(`[handleTransaction] CRITICAL FAILURE in ${functionName}:`, err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
            console.log(`[handleTransaction] <<< FINALIZED: ${functionName}`);
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
