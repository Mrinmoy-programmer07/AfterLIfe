# AfterLife Contract - Deployment Summary

## ✅ Successfully Deployed to Arbitrum Sepolia!

**Contract Address:** `0x3935129b6270998d57E2A092C90987B44310d634`

**Network:** Arbitrum Sepolia Testnet  
**Chain ID:** 421614  
**Deployed:** 2025-12-18

---

## 🔗 Quick Links

- **View on Arbiscan:** https://sepolia.arbiscan.io/address/0x584D45746E694Dd11233020c000C0bc00c2bddfA
- **Network RPC:** https://sepolia-rollup.arbitrum.io/rpc

---

## 🎯 Next Steps

### 1. Connect MetaMask to Arbitrum Sepolia

Make sure MetaMask is on the **Arbitrum Sepolia** network:
- Network Name: Arbitrum Sepolia
- RPC URL: https://sepolia-rollup.arbitrum.io/rpc
- Chain ID: 421614
- Symbol: ETH
- Explorer: https://sepolia.arbiscan.io

### 2. Use the App

1. Refresh the AfterLife app (http://localhost:3000)
2. Connect your wallet (the one you deployed with)
3. You should now be able to:
   - ✅ Add Guardians (on-chain)
   - ✅ Add Beneficiaries with vesting schedules (on-chain)
   - ✅ Prove Life / Send heartbeat (on-chain)

### 3. Test the Flow

**As Owner:**
1. Add a Guardian (use any Ethereum address)
2. Add a Beneficiary with allocation % and vesting schedule
3. Click "Prove Life" to update heartbeat

**View on Blockchain:**
- Every action creates a real transaction on Arbitrum Sepolia
- Check your transactions on Arbiscan
- All data is permanently stored on-chain

---

## 📊 Contract Details

**Constructor Parameters:**
- Inactivity Threshold: 2,592,000 seconds (30 days)

**Key Functions:**
- `proveLife()` - Owner updates heartbeat
- `addGuardian(name, address)` - Owner adds guardian
- `addBeneficiary(name, address, allocation, vestingType, duration)` - Owner adds beneficiary
- `confirmInactivity()` - Guardian triggers execution after threshold
- `claim()` - Beneficiary claims vested funds

---

## 🔐 Security Notes

- This is a **testnet deployment** (no real money)
- Contract is **not verified** yet (optional: verify on Arbiscan)
- Owner address: Your MetaMask wallet
- All transactions require gas fees (testnet ETH)

---

## 🐛 Troubleshooting

**"Contract not initialized"**
→ Make sure MetaMask is on Arbitrum Sepolia (Chain ID: 421614)

**"Transaction failed"**
→ Check you have enough testnet ETH for gas

**"Wrong network"**
→ Switch MetaMask to Arbitrum Sepolia network

---

**Contract is live and ready to use!** 🎉
