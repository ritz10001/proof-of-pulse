# Proof of Pulse — AI Agent Integration Summary

## Project Overview

**Proof of Pulse** is a decentralized wellness attestation platform that lets users prove real biometric activity (heart rate data) on-chain. It runs on the **XRP EVM Sidechain Testnet** with cross-chain settlement via **XRPL Devnet escrows**.

### Core Components
- **Attestation Engine** — Analyzes HR samples for fraud (warmup/cooldown checks, variability, sampling density) and produces a confidence score (0–100)
- **IPFS Storage (Pinata)** — Stores raw biometric data off-chain; only proof hash goes on-chain
- **Insurance Wellness DAO** — Users submit wellness cases → DAO votes → tier upgrade → XRPL escrow releases XRP rebate
- **Challenge Reward DAO** — Sponsors create fitness challenges with XRP prizes → users submit proof → DAO votes → escrow payout
- **XRPL Escrow** — Native XRPL escrow (EscrowCreate/EscrowFinish) for trustless payouts

### Tech Stack
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS v4, ethers.js v6
- **Backend:** Hono server (`backend-integration/`), shade-agent-js
- **Blockchain:** XRP EVM Testnet (chainId 1449000), XRPL Devnet
- **Storage:** Pinata IPFS (JWT-authenticated)
- **Wallet:** MetaMask with chain switching

---

## Deployed Contracts
| Contract | Address |
|----------|---------|
| ProofOfPulse | `0xCb93B233CFF21498eefF6bD713341494aa0406f5` |
| ChallengeRewardDAO | `0x56C0C6379b5A4763A975788Ee0fB2D79C1577E0E` |
| InsuranceWellnessDAO | `0xcAF9A23030fB80F953f48726b633f6aE9A3EFD71` |

---

## Key Files

### Frontend (Next.js)
| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing page with hero, pipeline, stats |
| `src/app/dao/page.tsx` | Insurance Wellness DAO — apply, vote, finalize |
| `src/app/dao/challenges/page.tsx` | Challenge Reward DAO — create, submit, vote |
| `src/components/Navbar.tsx` | Navigation with wallet connect |
| `src/blockchain/hooks/useInsuranceDAO.ts` | Insurance DAO contract hook |
| `src/blockchain/hooks/useDAO.ts` | Challenge DAO contract hook |
| `src/blockchain/providers/WalletProvider.tsx` | MetaMask connection provider |

### Backend (Hono)
| Path | Purpose |
|------|---------|
| `backend-integration/src/index.ts` | Server entry (imports routes, some missing) |
| `backend-integration/src/routes/analyze.ts` | `/api/analyze` — run attestation engine |
| `backend-integration/src/routes/attest.ts` | `/api/attest` — full attest + IPFS + on-chain |

### Shared Libraries
| Path | Purpose |
|------|---------|
| `src/lib/engine/attestation-engine.ts` | HR analysis, fraud detection, confidence scoring |
| `src/lib/pinata/storage.ts` | IPFS upload/retrieve via Pinata API |
| `src/lib/evm/submitter.ts` | On-chain attestation submission |
| `src/lib/xrpl/escrow.ts` | XRPL Devnet escrow create/finish/balance |

### Smart Contracts
| Path | Purpose |
|------|---------|
| `contracts/InsuranceWellnessDAO.sol` | Wellness case governance + tier/premium logic |
| `contracts/ChallengeRewardDAO.sol` | Challenge sponsorship + evidence voting |

---

## Pinata AI Agent (OpenClaw) — Integration Plan

### Use Case 1: Automated Proof Verification & Summarization
- Agent watches for new IPFS pins (workout uploads)
- Retrieves HR data, generates natural-language wellness summary
- Stores summary back to IPFS; feeds into DAO case `summary` field
- **Value:** Removes manual summary writing, ensures consistency

### Use Case 2: DAO Vote Recommendation Engine
- On new wellness case, agent pulls evidence from IPFS
- Analyzes biometric data for anomalies
- Posts AI recommendation to IPFS (approve/deny + reasoning)
- DAO voters reference this before casting votes
- **Value:** Reduces voter effort, catches fraud patterns humans miss

### Use Case 3: Wellness Score Trend Tracking
- Maintains per-user profile on IPFS aggregating all past attestations
- Tracks score trends (improving/declining/stable)
- Auto-triggers DAO case creation when trend warrants tier upgrade
- **Value:** Proactive tier management, gamification

### Use Case 4: Challenge Auto-Validation
- Cross-references submitted evidence against challenge requirements
- Pre-validates submissions before DAO vote
- **Value:** Faster challenge resolution, less voter burden

### Use Case 5: Natural Language Case Submission
- Users describe wellness journey in plain text → agent structures it → uploads to IPFS → creates on-chain case
- **Value:** Accessibility, lower barrier to entry

---

## Telegram Bot — Integration Plan

### Commands
| Command | Action |
|---------|--------|
| `/start` | Link wallet address, onboard user |
| `/submit` | Upload workout data → attestation engine → IPFS pin → return score |
| `/mystatus` | Current wellness tier, premium, pending cases |
| `/cases` | List active DAO cases with vote counts |
| `/vote <id> approve/deny` | Cast on-chain vote via backend |
| `/challenges` | List active fitness challenges |
| `/escrow` | Check XRPL escrow balance & pending releases |

### Push Notifications
- New case created → notify all DAO members
- Voting deadline approaching (1hr warning)
- Case finalized → notify applicant with result + escrow status
- Challenge completed → payout notification

### Architecture
```
User (Telegram) → TG Bot API → Hono Backend → {
  Attestation Engine,
  Pinata IPFS,
  XRP EVM Contract,
  XRPL Escrow
}
```

The bot acts as a lightweight frontend alternative — users can participate in the full DAO lifecycle without visiting the web app.

---

## Missing Backend Routes (to be created)
The backend `index.ts` imports these routes that don't exist yet:
- `routes/agentAccount.ts` — Agent wallet/account info
- `routes/agentInfo.ts` — Agent metadata and capabilities
- `routes/pendingRequests.ts` — Pending attestation/vote requests
- `routes/contract-views.ts` — Read-only contract queries
- `routes/vault.ts` — Key/secret management
- `routes/telegram.ts` — Telegram webhook handler

---

## Environment Variables
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_XRP_EVM_RPC_URL` | XRP EVM Testnet RPC |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | ProofOfPulse contract |
| `NEXT_PUBLIC_INSURANCE_DAO_ADDRESS` | InsuranceWellnessDAO contract |
| `NEXT_PUBLIC_DAO_CONTRACT_ADDRESS` | ChallengeRewardDAO contract |
| `ORACLE_PRIVATE_KEY` | Oracle/deployer wallet private key |
| `XRPL_ESCROW_WALLET_SEED` | XRPL Devnet escrow wallet |
| `PINATA_JWT` | Pinata API authentication |
| `PINATA_API_KEY` / `PINATA_API_SECRET` | Pinata legacy auth |
| `TELEGRAM_BOT_TOKEN` | (needed) Telegram bot token from @BotFather |
