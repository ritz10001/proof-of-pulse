# Backend Integration Complete ✅

The Proof of Pulse backend (Shade Agent) has been successfully integrated into your Next.js application.

## What Was Integrated

### 1. Core Libraries
- **Attestation Engine** (`src/lib/engine/attestation-engine.ts`) - Analyzes heart rate data and detects fraud
- **Pinata Storage** (`src/lib/pinata/storage.ts`) - Stores data on IPFS via Pinata
- **EVM Submitter** (`src/lib/evm/submitter.ts`) - Submits attestations to XRP EVM blockchain
- **Types** (`src/lib/types.ts`) - TypeScript type definitions

### 2. API Routes
- **POST /api/analyze** - Analyze heart rate data without blockchain submission
- **POST /api/attest** - Full flow: analyze + store on IPFS + submit to blockchain

### 3. Dependencies Installed
```json
{
  "hono": "^4.8.4",
  "@hono/node-server": "^1.15.0",
  "ethers": "^6.0.0",
  "dotenv": "^16.5.0",
  "fast-xml-parser": "^5.3.6"
}
```

## Configuration Required

### Environment Variables

Edit `.env.local` and add your credentials:

```env
# XRP EVM Sidechain Configuration
XRP_EVM_RPC_URL=https://rpc.testnet.xrplevm.org
CONTRACT_ADDRESS=0xCb93B233CFF21498eefF6bD713341494aa0406f5
ORACLE_PRIVATE_KEY=your_oracle_private_key_here

# Pinata IPFS Storage
PINATA_JWT=your_pinata_jwt_here

# Server Configuration
NODE_ENV=development
```

### Getting Credentials

**ORACLE_PRIVATE_KEY:**
1. Open MetaMask
2. Click account menu → Account details → Show private key
3. Enter password and copy key
4. ⚠️ This wallet must be authorized as an oracle on the contract

**PINATA_JWT:**
1. Go to https://app.pinata.cloud/
2. Sign up/login
3. API Keys → New Key
4. Copy JWT token

## API Usage

### Analyze Endpoint (No Blockchain)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "hr_samples": [
      {"timestamp": "2024-01-01T10:00:00Z", "bpm": 120},
      {"timestamp": "2024-01-01T10:00:05Z", "bpm": 125},
      {"timestamp": "2024-01-01T10:00:10Z", "bpm": 130}
    ]
  }'
```

**Response:**
```json
{
  "attestation": {
    "activity_type": "moderate_cardio",
    "duration_mins": 25,
    "avg_hr": 145,
    "max_hr": 177,
    "min_hr": 93,
    "hr_zone_distribution": {...},
    "recovery_score": 85,
    "confidence": 95,
    "analysis": {...},
    "data_hash": "0x..."
  },
  "session_info": {...},
  "hr_timeline": [...]
}
```

### Attest Endpoint (Full Flow)

```bash
curl -X POST http://localhost:3000/api/attest \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B",
    "hr_samples": [
      {"timestamp": "2024-01-01T10:00:00Z", "bpm": 120},
      {"timestamp": "2024-01-01T10:00:05Z", "bpm": 125}
    ]
  }'
```

**Response:**
```json
{
  "attestation": {...},
  "hr_timeline": [...],
  "tx_hash": "0xabc123...",
  "block_number": 12345,
  "attestation_key": "0x2B65...DEF9B:1234567890",
  "storage_id": "QmXxx...",
  "storage_type": "pinata_ipfs",
  "pinata": {
    "ipfs_hash": "QmXxx...",
    "file_hash": "sha256...",
    "gateway_url": "https://gateway.pinata.cloud/ipfs/QmXxx...",
    "pin_size": 12345
  },
  "explorer_url": "https://explorer.testnet.xrplevm.org/tx/0xabc123...",
  "oracle_type": "shade_agent_tee",
  "blockchain": "xrp_evm_sidechain"
}
```

## Frontend Integration Example

```typescript
// Example: Submit attestation from frontend
async function submitWorkout(hrSamples: any[], userAddress: string) {
  const response = await fetch('/api/attest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userAddress,
      hr_samples: hrSamples
    })
  });
  
  const result = await response.json();
  
  if (result.tx_hash) {
    console.log('Attestation submitted!');
    console.log('Transaction:', result.explorer_url);
    console.log('IPFS:', result.pinata?.gateway_url);
  }
  
  return result;
}
```

## Testing

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Analyze Endpoint
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "hr_samples": [
      {"timestamp": "2024-01-01T10:00:00Z", "bpm": 120},
      {"timestamp": "2024-01-01T10:00:05Z", "bpm": 125},
      {"timestamp": "2024-01-01T10:00:10Z", "bpm": 130},
      {"timestamp": "2024-01-01T10:00:15Z", "bpm": 135},
      {"timestamp": "2024-01-01T10:00:20Z", "bpm": 140},
      {"timestamp": "2024-01-01T10:00:25Z", "bpm": 145},
      {"timestamp": "2024-01-01T10:00:30Z", "bpm": 150},
      {"timestamp": "2024-01-01T10:00:35Z", "bpm": 155},
      {"timestamp": "2024-01-01T10:00:40Z", "bpm": 160},
      {"timestamp": "2024-01-01T10:00:45Z", "bpm": 165}
    ]
  }'
```

### 3. Test Attest Endpoint (requires credentials)
```bash
curl -X POST http://localhost:3000/api/attest \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B",
    "hr_samples": [...]
  }'
```

## How It Works

### 1. Fraud Detection Engine
The attestation engine analyzes heart rate patterns:
- Warmup/cooldown detection
- Beat-to-beat variability
- HR zone distribution
- Recovery score calculation
- Confidence scoring (0-100)

Real exercise shows natural patterns with variability. Spoofed data is flat or erratic.

### 2. IPFS Storage
Raw HR data is stored on Pinata IPFS:
- Uploads JSON with all HR samples
- Returns IPFS hash and gateway URL
- Metadata includes user ID, date, sample count

### 3. Blockchain Submission
Attestation is submitted to XRP EVM:
- Calls `submitAttestation()` on smart contract
- Oracle signs transaction with private key
- Returns transaction hash and explorer URL

## Network Details

- **Contract:** 0xCb93B233CFF21498eefF6bD713341494aa0406f5
- **Network:** XRP EVM Testnet
- **Chain ID:** 1449000
- **RPC:** https://rpc.testnet.xrplevm.org
- **Explorer:** https://explorer.testnet.xrplevm.org
- **Faucet:** https://faucet.xrplevm.org/

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git (already in .gitignore)
- Oracle private key must be kept secure
- In production, deploy in TEE (Trusted Execution Environment)
- Add rate limiting for production
- Use HTTPS only in production

## Next Steps

1. ✅ Backend integrated into Next.js
2. ⏳ Add your credentials to `.env.local`
3. ⏳ Test the API endpoints
4. ⏳ Integrate blockchain frontend (blockchain-integration/)
5. ⏳ Build UI to collect heart rate data
6. ⏳ Connect frontend to backend API

## Troubleshooting

### "ORACLE_PRIVATE_KEY not set"
Add your oracle private key to `.env.local`

### "Contract call failed"
- Verify oracle address is authorized on contract
- Check oracle has testnet XRP for gas
- Get testnet XRP from faucet: https://faucet.xrplevm.org/

### "Pinata upload failed"
- Verify PINATA_JWT is correct
- Check Pinata account has storage quota
- Backend will fallback to mock mode if Pinata unavailable

---

**Backend integration complete!** Ready to move on to blockchain frontend integration.
