<p align="center">
  <img src="https://img.shields.io/badge/XRP-EVM_Sidechain-blue?style=for-the-badge" alt="XRP EVM" />
  <img src="https://img.shields.io/badge/XRPL-Devnet_Escrow-purple?style=for-the-badge" alt="XRPL" />
  <img src="https://img.shields.io/badge/Pinata-IPFS-orange?style=for-the-badge" alt="Pinata" />
  <img src="https://img.shields.io/badge/Solidity-Smart_Contracts-363636?style=for-the-badge" alt="Solidity" />
  <img src="https://img.shields.io/badge/Telegram-Bot-26A5E4?style=for-the-badge" alt="Telegram" />
</p>

<h1 align="center">🫀 Proof of Pulse</h1>

<p align="center">
  <b>Privacy-preserving biometric attestation for decentralized insurance & fitness challenges</b><br/>
  <i>Prove you exercised. Lower your premiums. Earn XRP rewards. All without exposing raw health data.</i>
</p>

<p align="center">
  <code>Next.js 16</code> · <code>Solidity</code> · <code>XRP EVM Sidechain</code> · <code>XRPL Devnet Escrow</code> · <code>Pinata IPFS</code> · <code>Telegram Bot</code>
</p>

---

## 🎯 The Problem

Health insurance premiums only go up. There's no trustworthy, privacy-preserving way to prove you're getting healthier — and no mechanism for insurers to programmatically lower rates based on real biometric evidence.

Fitness challenges lack trust: sponsors can't verify claims, participants can't prove effort, and payouts require manual processing.

## 💡 The Solution

**Proof of Pulse** is a cross-chain platform where:

1. **Users prove real workouts** using heart rate data from wearables
2. **A fraud-detection engine** analyzes biometric patterns (warmup, cooldown, variability, HR zones) and generates a confidence score — raw data never goes on-chain
3. **Two DAO systems** govern outcomes:
   - **Insurance Wellness DAO** — Prove wellness → DAO votes → premium tier improves → XRP rebate released
   - **Challenge Reward DAO** — Sponsor creates challenge → participants submit proof → DAO votes → XRP payout
4. **Cross-chain settlement** — Governance on XRP EVM, payments via XRPL native escrow
5. **Telegram bot** — Vote on proposals, view cases, and finalize payouts from mobile

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER LAYER                                  │
│                                                                     │
│   Next.js Frontend          Telegram Bot          MetaMask Wallet   │
│   (glassmorphism UI)        (/vote, /cases)       (chain switching) │
└───────────┬─────────────────────┬─────────────────────┬─────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                                 │
│                                                                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│   │ Attestation  │  │ Pinata IPFS  │  │ Hono API Server          │ │
│   │ Engine       │  │ Storage      │  │ (port 3001)              │ │
│   │              │  │              │  │                          │ │
│   │ • Fraud      │  │ • Upload HR  │  │ • /api/analyze           │ │
│   │   detection  │  │   data       │  │ • /api/attest            │ │
│   │ • HR zones   │  │ • Retrieve   │  │ • /api/xrpl/*            │ │
│   │ • Confidence │  │   proofs     │  │ • /api/telegram          │ │
│   │   scoring    │  │ • Pin mgmt   │  │ • /api/contracts         │ │
│   └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└───────────┬─────────────────────┬─────────────────────┬─────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BLOCKCHAIN LAYER                                │
│                                                                     │
│   ┌─────────────────────────┐    ┌─────────────────────────┐       │
│   │   XRP EVM Sidechain     │    │    XRPL Devnet           │       │
│   │   (chainId: 1449000)    │    │    (native ledger)       │       │
│   │                         │    │                          │       │
│   │  ┌───────────────────┐  │    │  ┌────────────────────┐  │       │
│   │  │ InsuranceWellness │  │    │  │ EscrowCreate       │  │       │
│   │  │ DAO.sol           │  │    │  │ (locks XRP)        │  │       │
│   │  │                   │  │    │  │                    │  │       │
│   │  │ • createCase      │◄─┼────┼─►│ • finishAfter: 60s │  │       │
│   │  │ • voteOnCase      │  │    │  │ • cancelAfter: 24h │  │       │
│   │  │ • finalizeCase    │  │    │  │                    │  │       │
│   │  │ • tier/premium    │  │    │  │ EscrowFinish       │  │       │
│   │  └───────────────────┘  │    │  │ (releases XRP)     │  │       │
│   │                         │    │  └────────────────────┘  │       │
│   │  ┌───────────────────┐  │    │                          │       │
│   │  │ ChallengeReward   │  │    │  Escrow wallet:          │       │
│   │  │ DAO.sol           │◄─┼────┼─►rfN3LbLhNDtMRJH...     │       │
│   │  │                   │  │    │                          │       │
│   │  │ • createChallenge │  │    │                          │       │
│   │  │ • submitEvidence  │  │    │                          │       │
│   │  │ • vote / finalize │  │    │                          │       │
│   │  └───────────────────┘  │    │                          │       │
│   │                         │    │                          │       │
│   │  ┌───────────────────┐  │    │                          │       │
│   │  │ ProofOfPulse.sol  │  │    │                          │       │
│   │  │ (attestations)    │  │    │                          │       │
│   │  └───────────────────┘  │    │                          │       │
│   └─────────────────────────┘    └─────────────────────────┘       │
│                                                                     │
│                    CROSS-CHAIN LINK                                  │
│         EVM stores escrow tx hash ←→ XRPL holds the funds          │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Cross-Chain?

| Layer | Chain | Why |
|-------|-------|-----|
| **Governance** (voting, cases, tiers) | XRP EVM Sidechain | Solidity smart contracts, MetaMask compatibility, complex struct logic |
| **Payments** (escrow, payouts) | XRPL Devnet | Native `EscrowCreate`/`EscrowFinish` — trustless, time-locked, zero gas for release |

The EVM contract stores the XRPL escrow transaction hash. When the DAO finalizes a case as "Approved", the backend calls `EscrowFinish` on XRPL to release the locked XRP to the user.

---

## 🔬 Biometric Attestation Engine

The core innovation — a **fraud-detection engine** that analyzes heart rate data without ever putting raw biometrics on-chain.

```
Raw HR Data (120+ samples)
        │
        ▼
┌─────────────────────────────────┐
│      FRAUD DETECTION CHECKS     │
│                                 │
│  ✓ Warmup Detection             │  First 20% of samples should show
│    (gradual HR increase)        │  resting → active transition
│                                 │
│  ✓ Cooldown Detection           │  Last 15% should show HR declining
│    (gradual HR decrease)        │  back toward resting
│                                 │
│  ✓ Variability Analysis         │  Avg BPM diff between consecutive
│    (2-8 bpm natural range)      │  samples must be natural, not flat
│                                 │
│  ✓ Sampling Density             │  Sufficient data points per minute
│    (min 10 samples required)    │  to prevent fabrication
│                                 │
│  ✓ Natural Pattern Check        │  Combined check: real workouts have
│    (sine-wave-like variation)   │  organic HR curves, not step functions
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│      HR ZONE DISTRIBUTION       │
│                                 │
│  Zone 1 (Rest):      < 100 bpm │
│  Zone 2 (Light):   100-120 bpm │
│  Zone 3 (Moderate): 120-140 bpm│
│  Zone 4 (Vigorous): 140-160 bpm│
│  Zone 5 (Max):      > 160 bpm  │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│      OUTPUT                     │
│                                 │
│  Confidence Score: 0-100        │
│  Activity Type: cardio/light/.. │
│  Recovery Score: 0-100          │
│  Data Hash: SHA-256             │  ← Only this goes on-chain
│  Duration, Avg/Max/Min HR       │
└─────────────────────────────────┘
```

**Privacy guarantee:** Raw biometric data is stored on IPFS (Pinata) and is only accessible via the evidence URI. The blockchain only sees a proof hash and aggregated metrics.

---

## 🏥 Insurance Wellness DAO

> *"What if health insurance didn't only go up over time?"*

### Premium Tier System

| Tier | Wellness Score | Monthly Premium | Savings vs Standard |
|------|:--------------:|:---------------:|:-------------------:|
| 🔴 High Risk | < 50 | $220/mo | -$20 |
| ⚪ Standard | 50-69 | $200/mo | baseline |
| 🟢 Improved | 70-84 | $175/mo | +$25 |
| 🩷 Premium | 85+ | $150/mo | +$50 |

### Demo Flow

```
Step 1: Exercise        Step 2: Prove           Step 3: Submit
User works out    →    Run proof engine    →    Create wellness case
with wearable          (fraud detection)        on Insurance DAO
                       Score: 87%               + lock XRP in XRPL escrow

Step 4: DAO Review      Step 5: Rebate
Members vote       →   If approved:
Approve/Deny            • Tier upgraded to Premium
                        • XRPL escrow releases XRP rebate
                        • Premium: $200 → $150/mo
```

### Smart Contract: `InsuranceWellnessDAO.sol`

- **15-field `WellnessCase` struct** — applicant, evidence, score, premiums, votes, tier, timestamps
- **Tier calculation** — `_tierFromScore()` maps confidence → tier → premium
- **Rebate logic** — `_calculateRebate()` computes savings for escrow
- **Time-locked voting** — minimum 1-hour voting period (contract-enforced)
- **Events** — `WellnessCaseCreated`, `VoteCast`, `WellnessCaseFinalized`, `RebateApprovedForEscrow`

---

## 🏆 Challenge Reward DAO

### Demo Flow

```
Step 1: Create          Step 2: Lock XRP        Step 3: Workout
Sponsor defines    →    XRP locked in      →    Participant exercises
fitness challenge       XRPL escrow             and records HR data

Step 4: Prove           Step 5: DAO Vote        Step 6: Payout
Submit biometric   →    Members review     →    If approved:
evidence to DAO         and vote                XRPL escrow releases
                                                XRP to participant
```

### Smart Contract: `ChallengeRewardDAO.sol`

- **Challenge creation** with title, description, reward amount, escrow tx hash
- **Evidence submission** with IPFS proof URL and XRPL payout address
- **DAO voting** with approve/deny and time-locked deadlines
- **Finalization** triggers cross-chain XRPL escrow release

---

## 🤖 Telegram Bot

A mobile-first interface for DAO governance — vote on proposals without opening a browser.

### Commands

| Command | Description |
|---------|-------------|
| `/start` | Connect & see welcome message |
| `/cases` | List all active proposals with status & vote counts |
| `/case <id>` | Detailed view of a specific case |
| `/vote <id> yes` | Cast an APPROVE vote (on-chain tx) |
| `/vote <id> no` | Cast a DENY vote (on-chain tx) |
| `/finalize <id>` | Finalize voting & trigger escrow release |
| `/switch` | Toggle between Insurance DAO ↔ Challenge DAO |
| `/status` | Oracle wallet balance & case count |

The bot uses the oracle wallet to sign transactions directly on XRP EVM Sidechain. Each vote and finalize command produces a real on-chain transaction with block confirmation and explorer link.

---

## 🗂️ Project Structure

```
proof-of-pulse/
├── contracts/
│   ├── InsuranceWellnessDAO.sol     # Wellness tier governance
│   └── ChallengeRewardDAO.sol       # Fitness challenge rewards
│
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   ├── dao/
│   │   │   ├── page.tsx             # Insurance Wellness DAO UI
│   │   │   └── challenges/
│   │   │       └── page.tsx         # Challenge Reward DAO UI
│   │   └── api/
│   │       ├── analyze/route.ts     # Attestation engine API
│   │       ├── attest/route.ts      # Full attest + IPFS + on-chain
│   │       └── xrpl/               # XRPL escrow endpoints
│   │           ├── create-escrow/
│   │           ├── release-escrow/
│   │           └── wallet/
│   │
│   ├── lib/
│   │   ├── engine/
│   │   │   └── attestation-engine.ts  # Fraud detection & scoring
│   │   ├── pinata/
│   │   │   └── storage.ts            # IPFS upload/retrieve
│   │   ├── evm/
│   │   │   └── submitter.ts          # On-chain attestation
│   │   └── xrpl/
│   │       └── escrow.ts             # XRPL escrow operations
│   │
│   ├── blockchain/
│   │   ├── hooks/
│   │   │   ├── useInsuranceDAO.ts    # Insurance DAO React hook
│   │   │   └── useDAO.ts            # Challenge DAO React hook
│   │   ├── lib/
│   │   │   ├── insurance-dao-contract.ts
│   │   │   ├── dao-contract.ts
│   │   │   └── config.ts
│   │   └── providers/
│   │       └── WalletProvider.tsx    # MetaMask connection
│   │
│   └── components/
│       ├── Navbar.tsx
│       └── PixelHeart.tsx
│
├── backend-integration/
│   └── src/
│       ├── index.ts                  # Hono server entry
│       ├── telegram/
│       │   └── bot.ts               # Telegram bot (long-polling)
│       ├── routes/
│       │   ├── analyze.ts
│       │   ├── attest.ts
│       │   ├── telegram.ts
│       │   ├── agentAccount.ts
│       │   ├── agentInfo.ts
│       │   ├── contract-views.ts
│       │   ├── pendingRequests.ts
│       │   └── vault.ts
│       ├── engine/                   # Backend attestation engine
│       ├── pinata/                   # Backend IPFS storage
│       └── evm/                      # Backend EVM submitter
│
└── scripts/
    ├── deploy-dao.js                 # ChallengeRewardDAO deployer
    └── deploy-insurance-dao.js       # InsuranceWellnessDAO deployer
```

---

## 📋 Deployed Contracts

| Contract | Address | Network |
|----------|---------|---------|
| ProofOfPulse | `0xCb93B233CFF21498eefF6bD713341494aa0406f5` | XRP EVM Testnet |
| InsuranceWellnessDAO | `0xcAF9A23030fB80F953f48726b633f6aE9A3EFD71` | XRP EVM Testnet |
| ChallengeRewardDAO | `0x56C0C6379b5A4763A975788Ee0fB2D79C1577E0E` | XRP EVM Testnet |
| XRPL Escrow Wallet | `rfN3LbLhNDtMRJHWrmFZMH8shDTjyZMQTw` | XRPL Devnet |

**Explorer:** [explorer.testnet.xrplevm.org](https://explorer.testnet.xrplevm.org)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- XRP EVM Testnet configured in MetaMask (chainId: `1449000`, RPC: `https://rpc.testnet.xrplevm.org`)

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend-integration && npm install
```

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# XRP EVM Sidechain
NEXT_PUBLIC_XRP_EVM_RPC_URL=https://rpc.testnet.xrplevm.org
NEXT_PUBLIC_CONTRACT_ADDRESS=0xCb93B233CFF21498eefF6bD713341494aa0406f5
NEXT_PUBLIC_DAO_CONTRACT_ADDRESS=0x56C0C6379b5A4763A975788Ee0fB2D79C1577E0E
NEXT_PUBLIC_INSURANCE_DAO_ADDRESS=0xcAF9A23030fB80F953f48726b633f6aE9A3EFD71
NEXT_PUBLIC_CHAIN_ID=1449000

# Oracle wallet (signs attestations, votes, deploys)
ORACLE_PRIVATE_KEY=<your-private-key>

# XRPL Devnet escrow wallet
XRPL_ESCROW_WALLET_SEED=<your-xrpl-seed>

# Pinata IPFS
PINATA_JWT=<your-pinata-jwt>
PINATA_API_KEY=<your-pinata-api-key>
PINATA_API_SECRET=<your-pinata-api-secret>

# Telegram Bot
TELEGRAM_BOT_TOKEN=<your-bot-token-from-botfather>
```

### 3. Run

```bash
# Terminal 1: Frontend (Next.js)
npm run dev

# Terminal 2: Backend (Hono + Telegram Bot)
cd backend-integration
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001](http://localhost:3001)
- Telegram Bot: Running via long-polling (no public URL needed)

---

## 🎥 Demo Walkthrough

### Insurance Wellness DAO

1. **Connect MetaMask** → Switch to XRP EVM Testnet
2. **Go to Insurance DAO** → Click "Apply for Better Rate"
3. **Generate Proof** → Watch the live progress as the engine:
   - Collects 120 HR samples from a simulated 20-min cardio session
   - Detects warmup (72 → 120 bpm), main cardio (130-165 bpm), cooldown (140 → 95 bpm)
   - Runs fraud detection: variability check, natural pattern analysis
   - Computes HR zone distribution and confidence score
4. **Submit Case** → Uploads proof to IPFS, locks XRP in XRPL escrow, creates on-chain case
5. **Vote** → DAO members approve/deny (or use Telegram bot: `/vote 0 yes`)
6. **Finalize** → If approved: tier upgraded, XRPL escrow releases XRP rebate

### Challenge Reward DAO

1. **Create Challenge** → Define fitness goal + lock XRP reward in XRPL escrow
2. **Submit Evidence** → Participant uploads workout proof
3. **Vote & Finalize** → DAO approves → XRPL escrow releases XRP to participant

### Telegram Bot

1. Open bot in Telegram → Send `/start`
2. `/cases` → See all active proposals
3. `/vote 0 yes` → Cast on-chain vote
4. `/switch` → Toggle to Challenge DAO
5. `/finalize 0` → Finalize and trigger payout

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, ethers.js v6 |
| Backend | Hono (Node.js), tsx runtime |
| Smart Contracts | Solidity (compiled with solc + viaIR optimizer) |
| EVM Chain | XRP EVM Sidechain Testnet (chainId 1449000) |
| Native Ledger | XRPL Devnet (xrpl.js v4) |
| Storage | Pinata IPFS (JWT-authenticated) |
| Wallet | MetaMask with chain switching |
| Bot | node-telegram-bot-api (long-polling) |
| UI | Glassmorphism design system (`glass`, `glass-pink`, `glass-pink-solid`) |

---

## 🔑 Key Design Decisions

1. **Privacy-first:** Raw biometric data stays off-chain (IPFS). Only proof hash + wellness score go on-chain.

2. **Cross-chain by design:** EVM for governance logic (complex structs, voting, tier calculation). XRPL for payments (native escrow is trustless, time-locked, gas-free to release).

3. **Fraud detection over trust:** The attestation engine doesn't trust input data — it verifies physiological patterns. Flat HR, missing warmup/cooldown, unnatural variability all reduce confidence.

4. **DAO governance:** No single party decides outcomes. Members vote on wellness cases and challenge submissions within time-locked periods.

5. **Mobile-first governance:** The Telegram bot makes DAO participation accessible — vote on proposals from your phone with real on-chain transactions.

---

## 📄 License

MIT

---

<p align="center">
  <b>Built for the XRP Ledger Hackathon</b><br/>
  <i>Prove your pulse. Own your health data. Earn better rates.</i>
</p>
