# AfterLife | Temporal Asset Protocol ⏳⚖️

AfterLife is a decentralized "dead man's switch" protocol built on Arbitrum Sepolia. It ensures your digital assets are securely distributed to beneficiaries if you become inactive for a defined period, verified by a distributed network of guardians.

## 🌟 Key Features

- **Multi-Tenant Protocol:** Every user has their own isolated inheritance logic within a single master contract.
- **Heartbeat Verification:** Owners prove "liveliness" through simple on-chain interactions.
- **Guardian Consensus:** Trusted entities (Guardians) can trigger the inheritance process if the heartbeat threshold is exceeded.
- **Progressive Vesting:** Supports both **Linear** and **Cliff** vesting schedules for beneficiaries.
- **Premium UI:** A high-end, glassmorphic dashboard built with React, Framer Motion, and Three.js.

---

## 🏗️ Technical Architecture

### Core Stack
- **Smart Contracts:** Solidity (Deployed on Arbitrum Sepolia)
- **Frontend:** React + Vite + TypeScript
- **Web3 Integration:** Wagmi + Viem + TanStack Query
- **Styling:** Tailwind CSS + Custom Glassmorphism Engine
- **Animations:** Framer Motion + GSAP

### Primary Contract
- **Address:** `0x3935129b6270998d57E2A092C90987B44310d634`
- **Network:** Arbitrum Sepolia (Chain ID: 421614)

---

## 🛠️ Getting Started

### Prerequisites
- [pnpm](https://pnpm.io/)
- [MetaMask](https://metamask.io/) with Arbitrum Sepolia configured.

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm run dev
   ```

### Deployment (Build)
To generate production-ready files:
```bash
pnpm build
```

---

## 📘 User Guide

### 1. Owner Workflow
- **Register:** Initialize your protocol by setting an inactivity threshold (e.g., 30 days).
- **Add Guardians:** Assign trusted wallets to monitor your status.
- **Configure Beneficiaries:** Set wallet addresses and their percentage of your vault.
- **Prove Life:** Click "Prove Life" periodically to reset your heartbeat timer.

### 2. Guardian Workflow
- Monitor the owner's status.
- If the threshold is exceeded, the Guardian can "Confirm Inactivity" to begin asset distribution.

### 3. Beneficiary Workflow
- Once the protocol is in the "Executing" state, beneficiaries can claim their allocated assets based on the vesting schedule.

---

## 🛡️ Resilience Measures
The protocol is optimized for stable interaction:
- **Forced Gas Limits:** Uses a 1,000,000 gas buffer to bypass Arbitrum's estimation errors.
- **RPC Fallbacks:** Configured with a pool of resilient nodes (ThirdWeb, dRPC, PublicNode) to avoid rate limits.
- **Fail-Safe Write:** Gracefully handles RPC simulation failures by falling back to direct blockchain writing.

---

## 📄 License
This project is licensed under the MIT License.
