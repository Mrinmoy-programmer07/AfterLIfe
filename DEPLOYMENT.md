# Deploying AfterLife to Arbitrum Sepolia

## Prerequisites

### 1. Get Arbitrum Sepolia ETH (Free Testnet Tokens)

You need testnet ETH to pay for deployment gas fees. Here's how to get it:

**Option A: Alchemy Faucet (Recommended)**
1. Go to: https://www.alchemy.com/faucets/arbitrum-sepolia
2. Sign in with Google/GitHub
3. Enter your MetaMask wallet address
4. Receive 0.1 Sepolia ETH (enough for deployment)

**Option B: Chainlink Faucet**
1. Go to: https://faucets.chain.link/arbitrum-sepolia
2. Connect your wallet
3. Request testnet ETH

### 2. Get Your Private Key from MetaMask

⚠️ **IMPORTANT**: Only use a wallet with testnet funds, NEVER your mainnet wallet!

1. Open MetaMask
2. Click the 3 dots → Account Details
3. Click "Show Private Key"
4. Enter your password
5. Copy the private key

### 3. (Optional) Get Alchemy API Key

For better reliability:
1. Go to: https://www.alchemy.com/
2. Sign up (free)
3. Create a new app → Select "Arbitrum Sepolia"
4. Copy the API key

## Setup

### 1. Create `.env` file

In the project root, create a file named `.env` (no extension):

```env
PRIVATE_KEY=0xyour_private_key_here
ALCHEMY_API_KEY=your_alchemy_key_here
```

### 2. Add Arbitrum Sepolia to MetaMask

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add manually"
3. Enter:
   - **Network Name**: Arbitrum Sepolia
   - **RPC URL**: https://sepolia-rollup.arbitrum.io/rpc
   - **Chain ID**: 421614
   - **Currency Symbol**: ETH
   - **Block Explorer**: https://sepolia.arbiscan.io

## Deploy

Run the deployment command:

```bash
pnpm hardhat run scripts/deploy.js --network arbitrumSepolia
```

The contract address will be saved to `contract-address.json`.

## Verify Contract (Optional)

To verify your contract on Arbiscan:

1. Get Arbiscan API key: https://arbiscan.io/myapikey
2. Add to `.env`: `ARBISCAN_API_KEY=your_key`
3. Run:
```bash
pnpm hardhat verify --network arbitrumSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## After Deployment

The frontend will automatically connect to the deployed contract address from `contract-address.json`.
