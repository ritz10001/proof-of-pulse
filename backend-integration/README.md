# Proof of Pulse Backend Integration Package

This package contains the complete backend (Shade Agent) for Proof of Pulse biometric attestation oracle. It analyzes heart rate data, detects fraud, stores data on Pinata IPFS, and submits attestations to XRP EVM Sidechain.

## 📦 What's Included

```
backend-integration/
├── README.md                          # This file
├── INTEGRATION_GUIDE.md              # Step-by-step integration instructions
├── package.json                       # Dependencies
├── tsconfig.json                      # TypeScript configuration
├── .env.example                       # Environment variables template
└── src/
    ├── index.ts                       # Server entry point (Hono)
    ├── types.ts                       # TypeScript types
    ├── engine/
    │   └── attestation-engine.ts     # Fraud detection & analysis
    ├── parser/
    │   └── health-export-parser.ts   # Apple Health XML parser
    ├── pinata/
    │   └── storage.ts                # Pinata IPFS storage
    ├── evm/
    │   └── submitter.ts              # XRP EVM blockchain submitter
    └── routes/
        ├── analyze.ts                # POST /api/analyze
        └── attest.ts                 # POST /api/attest
```

## 🚀 Quick Start

### 1. Copy Files
```bash
cp -r backend-integration /path/to/your/project/
cd /path/to/your/project/backend-integration
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env.development.local
```

Edit `.env.development.local`:
```env
# XRP EVM Configuration
XRP_EVM_RPC_URL=https://rpc.testnet.xrplevm.org
CONTRACT_ADDRESS=0xCb93B233CFF21498eefF6bD713341494aa0406f5
ORACLE_PRIVATE_KEY=<your_oracle_private_key>

# Pinata IPFS
PINATA_JWT=<your_pinata_jwt>

# Server
PORT=3001
NODE_ENV=development
```

### 4. Start Server
```bash
npm run dev
```

Server runs on `http://localhost:3001`

## 📡 API Endpoints

### POST /api/analyze
Analyze heart rate data and return attestation (no blockchain submission)

**Request:**
```json
{
  "hr_samples": [
    { "timestamp": "2024-01-01T10:00:00Z", "bpm": 120 },
    { "timestamp": "2024-01-01T10:00:05Z", "bpm": 125 }
  ]
}
```

**Response:**
```json
{
  "attestation": {
    "activity_type": "high_intensity_cardio",
    "duration_mins": 25,
    "avg_hr": 145,
    "max_hr": 177,
    "min_hr": 93,
    "hr_zone_distribution": { ... },
    "recovery_score": 85,
    "confidence": 95,
    "data_hash": "0x..."
  },
  "hr_timeline": [...]
}
```

### POST /api/attest
Analyze, store on IPFS, and submit to blockchain

**Request:**
```json
{
  "user_id": "0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B",
  "hr_samples": [...]
}
```

**Response:**
```json
{
  "attestation": { ... },
  "hr_timeline": [...],
  "tx_hash": "0x...",
  "block_number": 12345,
  "attestation_key": "0x2B65...DEF9B:1234567890",
  "storage_id": "QmXxx...",
  "explorer_url": "https://explorer.testnet.xrplevm.org/tx/0x...",
  "pinata": {
    "ipfs_hash": "QmXxx...",
    "gateway_url": "https://gateway.pinata.cloud/ipfs/QmXxx..."
  }
}
```

## 🔧 How It Works

### 1. Fraud Detection Engine
`src/engine/attestation-engine.ts` analyzes heart rate patterns:
- Warmup/cooldown detection
- Beat-to-beat variability
- HR zone distribution
- Recovery score calculation
- Confidence scoring (0-100)

### 2. IPFS Storage
`src/pinata/storage.ts` stores raw HR data on Pinata IPFS:
- Uploads JSON with all HR samples
- Returns IPFS hash and gateway URL
- Metadata includes user ID, date, sample count

### 3. Blockchain Submission
`src/evm/submitter.ts` submits attestation to XRP EVM:
- Calls `submitAttestation()` on smart contract
- Oracle signs transaction with private key
- Returns transaction hash and explorer URL

## 🔐 Security

- Oracle private key must be kept secure
- Never expose private key in frontend
- Backend runs in TEE (Trusted Execution Environment) in production
- All transactions signed by authorized oracle address

## 📝 Integration with Frontend

Your frontend should:
1. Collect heart rate data from user
2. POST to `/api/attest` with `user_id` (wallet address) and `hr_samples`
3. Display attestation result and blockchain transaction

See `blockchain-integration/` package for frontend integration.

## 🧪 Testing

```bash
# Test with sample data
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "hr_samples": [
      {"timestamp": "2024-01-01T10:00:00Z", "bpm": 120},
      {"timestamp": "2024-01-01T10:00:05Z", "bpm": 125}
    ]
  }'
```

## 🌐 Network Details

- **Network:** XRP EVM Sidechain Testnet
- **Chain ID:** 1449000
- **RPC:** https://rpc.testnet.xrplevm.org
- **Explorer:** https://explorer.testnet.xrplevm.org
- **Contract:** 0xCb93B233CFF21498eefF6bD713341494aa0406f5
- **Faucet:** https://faucet.xrplevm.org/

## 📚 Documentation

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed integration instructions.

## 🛠️ Tech Stack

- **Framework:** Hono (lightweight web framework)
- **Runtime:** Node.js with TypeScript
- **Blockchain:** ethers.js v6
- **Storage:** Pinata IPFS
- **Parser:** fast-xml-parser (for Apple Health XML)

## 📄 License

Same as parent project
