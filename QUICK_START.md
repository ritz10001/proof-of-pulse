# 🚀 Quick Start Guide

## Backend Integration Complete ✅

Your Proof of Pulse backend is fully integrated into Next.js!

## Get Started in 3 Steps

### 1. Add Your Credentials

Edit `.env.local`:

```env
ORACLE_PRIVATE_KEY=your_oracle_private_key_here
PINATA_JWT=your_pinata_jwt_here
```

**Get credentials:**
- **ORACLE_PRIVATE_KEY:** MetaMask → Account details → Show private key
- **PINATA_JWT:** https://app.pinata.cloud/ → API Keys → New Key

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test the Backend

Visit: http://localhost:3000/test-backend

Or use curl:

```bash
# Test analyze endpoint (no credentials needed)
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

## What's Integrated

✅ Fraud detection engine
✅ IPFS storage (Pinata)
✅ XRP EVM blockchain submission
✅ API routes: `/api/analyze` and `/api/attest`
✅ Test page: `/test-backend`

## API Endpoints

### POST /api/analyze
Analyze heart rate data (no blockchain)

### POST /api/attest
Full flow: analyze + IPFS + blockchain

## Files Created

```
src/
├── lib/
│   ├── types.ts
│   ├── engine/attestation-engine.ts
│   ├── pinata/storage.ts
│   └── evm/submitter.ts
├── app/
│   ├── api/
│   │   ├── analyze/route.ts
│   │   └── attest/route.ts
│   └── test-backend/page.tsx
.env.local
.env.example
BACKEND_INTEGRATION_README.md
INTEGRATION_STATUS.md
```

## Next Steps

1. ✅ Backend integrated
2. ⏳ Add credentials to `.env.local`
3. ⏳ Test endpoints
4. ⏳ Integrate blockchain frontend (blockchain-integration/)

## Documentation

- `BACKEND_INTEGRATION_README.md` - Complete backend guide
- `INTEGRATION_STATUS.md` - Integration status
- `INTEGRATION_MASTER_GUIDE.md` - Master guide

## Need Help?

Check the documentation files or visit:
- XRP EVM Explorer: https://explorer.testnet.xrplevm.org
- Faucet: https://faucet.xrplevm.org/
- Pinata: https://app.pinata.cloud/

---

**Ready to go!** 🎉
