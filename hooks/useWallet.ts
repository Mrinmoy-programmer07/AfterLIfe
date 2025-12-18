import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export interface WalletState {
    address: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
    connect: () => Promise<void>;
    disconnect: () => void;
}

export const useWallet = (): WalletState => {
    const [address, setAddress] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connect = async () => {
        console.log("Connect initiated...");
        if (!window.ethereum) {
            console.error("MetaMask object not found on window");
            setError("MetaMask not detected");
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            console.log("Creating BrowserProvider...");
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            console.log("Requesting accounts...");
            const accounts = await browserProvider.send("eth_requestAccounts", []);
            console.log("Accounts received:", accounts);

            if (accounts.length > 0) {
                const signerInstance = await browserProvider.getSigner();
                setProvider(browserProvider);
                setSigner(signerInstance);
                setAddress(accounts[0]);
                console.log("Wallet connected successfully");
            }
        } catch (err: any) {
            console.error("Connection Error:", err);
            setError(err.message || "Failed to connect wallet");
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        setAddress(null);
        setProvider(null);
        setSigner(null);
    };

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                    // Re-instantiate signer on account change
                    const browserProvider = new ethers.BrowserProvider(window.ethereum);
                    const signerInstance = await browserProvider.getSigner();
                    setProvider(browserProvider);
                    setSigner(signerInstance);
                } else {
                    setAddress(null);
                    setProvider(null);
                    setSigner(null);
                }
            });
        }
    }, []);

    return {
        address,
        isConnected: !!address,
        isConnecting,
        error,
        provider,
        signer,
        connect,
        disconnect
    };
};

/* TypeScript declaration for window.ethereum */
declare global {
    interface Window {
        ethereum: any;
    }
}
