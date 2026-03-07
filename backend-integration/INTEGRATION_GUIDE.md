# Backend Integration Guide: Shade Agent

## For Kiro AI Assistant

This guide helps you integrate the Proof of Pulse backend (Shade Agent) into a new project.

---

## Step 1: Copy Files

Copy the entire `backend-integration` folder:

```bash
cp -r backend-integration /path/to/your/project/backend
cd /path/to/your/project/backend
```

---

## Step 2: Install Dependencies

```bash
npm install
```

**Dependencies installed:**
- `hono` - Web framework
- `@hono/node-server` - Node.js adapter
- `ethers` - Ethereum/XRP EVM interaction
- `dotenv` - Environment variables
- `fast-xml-parser` - Apple Health XML parsing
- `tsx` - TypeScript execution
- `typescript` - TypeScript compiler

---

## Step 3: Environment Configuration

Create `.env.development.local`:

```env
# XRP EVM Sidechain Configuration
XRP_EVM_RPC_URL=https://rpc.testnet.xrplevm.org
CONTRACT_ADDRESS=0xCb93B233CFF21498eefF6bD713341494aa0406f5
ORACLE_PRIVATE_KEY=<your_oracle_private_key>

# Pinata IPFS Storage
PINATA_JWT=<your_pinata_jwt>

# Server Configuration
PORT=3001
NODE_ENV=development
```

**Getting credentials:**
- **ORACLE_PRIVATE_KEY:** Export from MetaMask (must be authorized oracle on contract)
- **PINATA_JWT:** Get from https://app.pinata.cloud/ → API Keys → New Key

---

## Step 4: Start Server

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

Server runs on `http://localhost:3001`

---

## API Endpoints

### Health Check
```bash
GET /
```

Returns: `{ "message": "Proof of Pulse Shade Agent is running" }`

### Analyze Workout (No Blockchain)
```bash
POST /api/analyze
Content-Type: application/json

{
  "hr_samples": [
    { "timestamp": "2024-01-01T10:00:00Z", "bpm": 120 },
    { "timestamp": "2024-01-01T10:00:05Z", "bpm": 125 },
    ...
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
    "hr_zone_distribution": {
      "zone1_rest": 10,
      "zone2_light": 20,
      "zone3_moderate": 30,
      "zone4_vigorous": 25,
      "zone5_max": 15
    },
    "recovery_score": 85,
    "confidence": 95,
    "analysis": {
      "is_natural_pattern": true,
      "has_warmup": true,
      "has_cooldown": true,
      "variability_score": 75,
      "sampling_density": 12.5
    },
    "data_hash": "0x..."
  },
  "hr_timeline": [
    { "time": "2024-01-01T10:00:00Z", "bpm": 120 },
    ...
  ]
}
```

### Submit Attestation (Full Flow)
```bash
POST /api/attest
Content-Type: application/json

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

---

## Architecture Overview

### 1. Entry Point (`src/index.ts`)
- Hono web server
- CORS enabled
- Routes mounted at `/api/*`

### 2. Attestation Engine (`src/engine/attestation-engine.ts`)
**Pure function - no I/O, fully deterministic**

Analyzes workout session:
- Basic stats (avg/max/min HR)
- HR zone distribution (5 zones)
- Warmup/cooldown detection
- Beat-to-beat variability
- Recovery score
- Confidence score (0-100)
- Activity type classification

**Fraud Detection:**
- Flat/spoofed data has low variability
- Real exercise shows natural patterns
- Sampling density affects confidence
- Wider HR range = more likely real

### 3. Health Parser (`src/parser/health-export-parser.ts`)
- Parses Apple Health XML exports
- Extracts heart rate samples
- Identifies workout sessions by date
- Filters by HR threshold and time gaps

### 4. Pinata Storage (`src/pinata/storage.ts`)
- Uploads raw HR data to IPFS
- Returns IPFS hash and gateway URL
- Includes metadata (user ID, date, sample count)
- Graceful fallback if Pinata unavailable

### 5. EVM Submitter (`src/evm/submitter.ts`)
- Connects to XRP EVM Sidechain
- Signs transactions with oracle private key
- Calls `submitAttestation()` on smart contract
- Returns transaction hash and explorer URL

### 6. Routes
- `/api/analyze` - Analysis only (no blockchain)
- `/api/attest` - Full flow (analyze + store + submit)

---

## Integration Patterns

### Pattern 1: Frontend Calls Backend
```typescript
// Frontend code
async function submitWorkout(hrSamples: HRSample[], userAddress: string) {
  const response = await fetch('http://localhost:3001/api/attest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userAddress,
      hr_samples: hrSamples
    })
  });
  
  const result = await response.json();
  return result;
}
```

### Pattern 2: Apple Health XML Upload
```typescript
// Frontend uploads XML file
const formData = new FormData();
formData.append('xml_file', file);
formData.append('user_id', userAddress);
formData.append('date', '2024-01-01');

const response = await fetch('http://localhost:3001/api/attest', {
  method: 'POST',
  body: formData
});
```

### Pattern 3: Analysis Preview (No Blockchain)
```typescript
// Show user analysis before submitting to blockchain
const analysis = await fetch('http://localhost:3001/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hr_samples })
}).then(r => r.json());

// Show confidence score, activity type, etc.
console.log('Confidence:', analysis.attestation.confidence);

// If user approves, submit to blockchain
if (userApproves) {
  await submitToBlockchain();
}
```

---

## Customization

### Add New Route
```typescript
// src/routes/my-route.ts
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "My custom route" });
});

export default app;
```

```typescript
// src/index.ts
import myRoute from "./routes/my-route.js";

app.route("/api/my-route", myRoute);
```

### Modify Fraud Detection
Edit `src/engine/attestation-engine.ts`:
```typescript
// Adjust confidence scoring
confidence += Math.min(25, (durationMins / 20) * 25); // Duration factor
confidence += is_natural_pattern ? 25 : 5;            // Pattern bonus
confidence += Math.min(20, variability_score * 0.2);  // Variability
```

### Change Storage Provider
Replace `src/pinata/storage.ts` with your own storage module:
```typescript
export async function uploadToStorage(samples: HRSample[]): Promise<string> {
  // Your storage logic
  return "storage_id";
}
```

---

## Troubleshooting

### Issue: "ORACLE_PRIVATE_KEY not set"
**Solution:** Add to `.env.development.local`:
```env
ORACLE_PRIVATE_KEY=0x...
```

### Issue: "Contract call failed"
**Solution:** 
1. Check oracle address is authorized on contract
2. Verify contract address is correct
3. Ensure RPC URL is accessible
4. Check oracle has testnet XRP for gas

### Issue: "Pinata upload failed"
**Solution:**
1. Verify PINATA_JWT is correct
2. Check Pinata account has storage quota
3. Backend will fallback to mock mode if Pinata unavailable

### Issue: "Port 3001 already in use"
**Solution:** Change port in `.env.development.local`:
```env
PORT=3002
```

---

## Deployment

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=3001
XRP_EVM_RPC_URL=https://rpc.testnet.xrplevm.org
CONTRACT_ADDRESS=0xCb93B233CFF21498eefF6bD713341494aa0406f5
ORACLE_PRIVATE_KEY=<secure_key>
PINATA_JWT=<secure_jwt>
```

---

## Testing

### Manual Test
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "hr_samples": [
      {"timestamp": "2024-01-01T10:00:00Z", "bpm": 120},
      {"timestamp": "2024-01-01T10:00:05Z", "bpm": 125},
      {"timestamp": "2024-01-01T10:00:10Z", "bpm": 130}
    ]
  }'
```

### Unit Tests
```bash
npm test
```

---

## Security Best Practices

1. **Never expose oracle private key** - Keep in `.env` file, never commit
2. **Use environment variables** - Don't hardcode credentials
3. **Validate inputs** - Check user_id format, HR sample count
4. **Rate limiting** - Add rate limiting in production
5. **CORS configuration** - Restrict origins in production
6. **HTTPS only** - Use HTTPS in production
7. **TEE deployment** - Deploy in Trusted Execution Environment for production

---

## Next Steps

1. Start backend server
2. Test with sample data
3. Integrate with frontend
4. Deploy to production
5. Monitor transactions on explorer

---

**Ready to integrate!** 🚀
