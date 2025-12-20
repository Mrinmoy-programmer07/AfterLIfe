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
        console.log("[useAfterLifeContract] Validating network...");
        if (!isConnected) {
            console.error("[useAfterLifeContract] Error: Wallet not connected");
            throw new Error("Wallet not connected");
        }
        console.log("[useAfterLifeContract] Connection confirmed:", userAddress);
        console.log("[useAfterLifeContract] Chain ID:", chain?.id);

        // Allow both Arbitrum Sepolia (421614) and Mantle Sepolia (5003)
        if (chain?.id !== 421614 && chain?.id !== 5003) {
            console.error(`[useAfterLifeContract] Error: Unsupported network ${chain?.id}`);
            throw new Error("Please switch MetaMask to Arbitrum Sepolia or Mantle Sepolia");
        }
        console.log("[useAfterLifeContract] Network validation complete.");
    };

    const handleTransaction = async (functionName: string, args: any[], value?: bigint) => {
        setIsLoading(true);
        setError(null);
        console.log(`[handleTransaction] >>> INITIALIZING: ${functionName}`);

        try {
            validateNetwork();

            // --- Deep Diagnostics ---
            if (typeof window !== 'undefined') {
                const eth = (window as any).ethereum;
                console.log(`[handleTransaction] PROVIDER CHECK:`, eth ? "Detected" : "MISSING");
                if (eth?.providers?.length > 1) {
                    console.warn(`[handleTransaction] WARNING: Multiple wallet providers detected (${eth.providers.length}). This causes "Internal JSON-RPC error".`);
                }
            }

            if (publicClient && userAddress) {
                const balance = await publicClient.getBalance({ address: userAddress });
                console.log(`[handleTransaction] DIAGNOSTIC: User Balance = ${formatEther(balance)} ETH`);

                if (balance === 0n) {
                    console.warn(`[handleTransaction] WARNING: ZERO BALANCE detected. This will cause JSON-RPC errors.`);
                }

                if (functionName === 'register') {
                    const alreadyOwner = await publicClient.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: AfterLifeArtifact.abi,
                        functionName: 'isOwner',
                        args: [userAddress]
                    } as any) as boolean;
                    if (alreadyOwner) {
                        console.error(`[handleTransaction] FATAL: Logic Error - Account ${userAddress} is already registered.`);
                        throw new Error("Account already registered in the contract.");
                    }
                }
            }

            console.log("-------------------------------------------");
            console.log(`[handleTransaction] PROCLAIM: ${functionName}`);
            console.log(`[handleTransaction] Args:`, JSON.stringify(args, (_, v) => typeof v === 'bigint' ? v.toString() : v));
            console.log(`[handleTransaction] Value:`, value?.toString() || "0");
            console.log(`[handleTransaction] Contract:`, CONTRACT_ADDRESS);
            console.log("-------------------------------------------");

            let hash;

            // Optional Simulation
            let simulatedRequest = null;
            // SKIP simulation for Mantle (5003) due to RPC instability/gas quirks
            const shouldSimulate = publicClient && userAddress && activeChainId !== 5003;

            if (shouldSimulate) {
                console.log(`[handleTransaction] Attempting simulation for ${functionName}...`);
                try {
                    const { request } = await publicClient.simulateContract({
                        address: CONTRACT_ADDRESS,
                        abi: AfterLifeArtifact.abi,
                        functionName,
                        args,
                        account: userAddress,
                        value: value,
                        gas: BigInt(60000000),
                    });
                    simulatedRequest = request;
                    console.log(`[handleTransaction] Simulation SUCCESS for ${functionName}`);
                } catch (simError: any) {
                    const errorMsg = (simError.message || "").toLowerCase();
                    console.warn(`[handleTransaction] Simulation REVERTED/FAILED: ${errorMsg}`);
                    console.dir(simError); // DUMP ENTIRE ERROR OBJECT FOR DEBUGGING

                    const shouldBypassSimulation =
                        errorMsg.includes('rate limit') ||
                        errorMsg.includes('too many requests') ||
                        errorMsg.includes('failed to fetch') ||
                        errorMsg.includes('fetch failed') ||
                        errorMsg.includes('network error') ||
                        errorMsg.includes('internal json-rpc error') ||
                        errorMsg.includes('json-rpc error') ||
                        errorMsg.includes('reverted') ||
                        errorMsg.includes('out of gas') ||
                        errorMsg.includes('transaction creation failed');

                    if (shouldBypassSimulation) {
                        console.warn(`[handleTransaction] BYPASSING simulation for ${functionName} (RPC issue)`);
                    } else {
                        console.error(`[handleTransaction] FATAL Simulation Error:`, simError);
                        throw new Error(`Simulation Failed: ${simError.shortMessage || simError.message}`);
                    }
                }
            } else if (activeChainId === 5003) {
                console.log(`[handleTransaction] SKIPPING simulation for Mantle network.`);
            }

            // Execute Transaction
            console.log(`[handleTransaction] >>> TRIGGERING MetaMask Handshake for ${functionName}...`);

            const executeWrite = async (isFallback: boolean = false) => {
                if (!isFallback && simulatedRequest) {
                    console.log(`[handleTransaction] Using simulated request`);
                    return await writeContractAsync(simulatedRequest);
                } else {
                    console.log(`[handleTransaction] Using direct write ${isFallback ? '(fallback retry)' : '(simulation bypassed)'}`);

                    // Mantle requires high gas but 60M might be too expensive/over the limit. 10M is safer.
                    const gasLimit = activeChainId === 5003 ? BigInt(10000000) : BigInt(3000000);

                    const txParams: any = {
                        address: CONTRACT_ADDRESS,
                        abi: AfterLifeArtifact.abi,
                        functionName,
                        args,
                        gas: gasLimit,
                    };
                    if (value && value > 0n) txParams.value = value;

                    return await writeContractAsync(txParams);
                }
            };

            hash = await executeWrite();

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
