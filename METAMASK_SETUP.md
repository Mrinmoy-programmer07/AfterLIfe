# MetaMask Setup for Local Development

## Add Hardhat Network to MetaMask

1. **Open MetaMask** and click the network dropdown at the top
2. Click **"Add Network"** → **"Add a network manually"**
3. Enter these details:
   - **Network Name**: `Hardhat Local`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
4. Click **Save**

## Import a Test Account

The Hardhat node provides test accounts with 10,000 ETH each. Import one:

1. In MetaMask, click your account icon → **Import Account**
2. Select **"Private Key"**
3. Paste one of these private keys (from the Hardhat node terminal):
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
   (This is Account #0 - publicly known test key, NEVER use on mainnet!)

4. Click **Import**

## Verify Connection

- Make sure MetaMask shows **"Hardhat Local"** network
- Your balance should show **10000 ETH**
- Refresh the AfterLife app page

Now the contract should initialize properly!
