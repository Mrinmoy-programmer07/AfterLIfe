# Quick Fix: Connect to Arbitrum Sepolia

## The Issue
You're seeing "Contract not initialized" because MetaMask is not connected to the Arbitrum Sepolia network.

## Solution (2 minutes)

### Option 1: Add Network Manually
1. Open MetaMask
2. Click the network dropdown (top left)
3. Click "Add Network" → "Add a network manually"
4. Fill in:
   - **Network Name**: `Arbitrum Sepolia`
   - **RPC URL**: `https://sepolia-rollup.arbitrum.io/rpc`
   - **Chain ID**: `421614`
   - **Currency Symbol**: `ETH`
   - **Block Explorer**: `https://sepolia.arbiscan.io`
5. Click "Save"
6. Switch to "Arbitrum Sepolia" network
7. Refresh the app

### Option 2: Use Chainlist (Easier)
1. Go to: https://chainlist.org/
2. Search for "Arbitrum Sepolia"
3. Click "Add to MetaMask"
4. Approve in MetaMask
5. Switch to the network
6. Refresh the app

## Verify It's Working
After switching networks, you should see:
- The red error banner disappears
- You can add guardians/beneficiaries
- MetaMask prompts you to sign transactions

## Still Not Working?
Check the browser console (F12) and look for the line:
```
Connected to network: <number>
```
It should say `421614` (Arbitrum Sepolia)
