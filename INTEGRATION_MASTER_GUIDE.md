# 🎯 Integration Master Guide

**Complete guide for integrating Proof of Pulse into any project**

---

## 📦 What You Have

Two standalone packages ready to integrate:

1. **blockchain-integration/** - Frontend (XRP EVM + MetaMask)
2. **backend-integration/** - Backend (Oracle + IPFS)

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Frontend Only
```bash
cp -r blockchain-integration /path/to/frontend/src/
cd /path/to/frontend
npm install ethers@^6.0.0
```

Then tell Kiro:
> "Read blockchain-integration/INTEGRATION_GUIDE.md and integrate it"

### Option 2: Backend Only
```bash
cp -r backend-integration /path/to/project/backend
cd /path/to/project/backend
npm install
cp .env.example .env.development.local
# Edit .env.development.local
npm run dev
```

### Option 3: Full Stack
```bash
# Copy both
cp -r blockchain-integration /path/to/frontend/src/
cp -r backend-integration /path/to/project/backend

# Setup backend
cd /path/to/project/backend
npm install
cp .env.example .env.development.local
# Edit with ORACLE_PRIVATE_KEY and PINATA_JWT
npm run dev

# Setup frontend
cd /path/to/frontend
npm install ethers@^6.0.0
# Tell Kiro to integrate blockchain-integration/
npm run dev
```

---

## 📚 Documentation Structure

```
Documentation/
├── INTEGRATION_MASTER_GUIDE.md        ← You are here (start here)
├── BLOCKCHAIN_PACKAGE_READY.md        ← Overview of both packages
├── INTEGRATION_PACKAGES_COMPLETE.md   ← Detailed package info
├── PACKAGES_SUMMARY.md                ← Visual summary
├── PACKAGE_VERIFICATION.md            ← Verification checklist
│
├── blockchain-integration/
│   ├── README.md                      ← Frontend quick start
│   └── INTEGRATION_GUIDE.md           ← Frontend integration for Kiro
│
└── backend-integration/
    ├── README.md                      ← Backend quick start
    └── INTEGRATION_GUIDE.md           ← Backend integration for Kiro
```

**Read order:**
1. This file (INTEGRATION_MASTER_GUIDE.md) - Overview
2. PACKAGES_SUMMARY.md - Visual summary
3. blockchain-integration/INTEGRATION_GUIDE.md - Frontend details
4. backend-integration/INTEGRATION_GUIDE.md - Backend details

---

## 🎯 Choose Your Integration Path

### Path A: I Have a Frontend, Need Blockchain
**Use:** blockchain-integration/

**Steps:**
1. Copy `blockchain-integration/` to your frontend
2. Install ethers: `npm install ethers@^6.0.0`
3. Add environment variables
4. Tell Kiro: "Read blockchain-integration/INTEGRATION_GUIDE.md and integrate"

**Time:** ~5 minutes

### Path B: I Have a Backend, Need Oracle
**Use:** backend-integration/

**Steps:**
1. Copy `backend-integration/` to your project
2. Install dependencies: `npm install`
3. Configure `.env.development.local`
4. Start server: `npm run dev`

**Time:** ~10 minutes

### Path C: I'm Building From Scratch
**Use:** Both packages

**Steps:**
1. Copy both packages
2. Setup backend first (port 3001)
3. Setup frontend (port 3000)
4. Connect frontend to backend API
5. Test end-to-end flow

**Time:** ~15 minutes

### Path D: I Just Want to Understand
**Read:**
1. PACKAGES_SUMMARY.md - Visual overview
2. blockchain-integration/README.md - Frontend capabilities
3. backend-integration/README.md - Backend capabilities

**Time:** ~10 minutes reading

---

## 🔧 Configuration

### Frontend Environment Variables
```env
NEXT_PUBLIC_XRP_EVM_RPC_URL=https://rpc.testnet.xrplevm.org
NEXT_PUBLIC_CONTRACT_ADDRESS=0xCb93B233CFF21498eefF6bD713341494aa0406f5
NEXT_PUBLIC_CHAIN_ID=1449000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001  # If using backend
```

### Backend Environment Variables
```env
XRP_EVM_RPC_URL=https://rpc.testnet.xrplevm.org
CONTRACT_ADDRESS=0xCb93B233CFF21498eefF6bD713341494aa0406f5
ORACLE_PRIVATE_KEY=<your_oracle_private_key>
PINATA_JWT=<your_pinata_jwt>
PORT=3001
NODE_ENV=development
```

### Getting Credentials

**ORACLE_PRIVATE_KEY:**
1. Open MetaMask
2. Click account menu → Account details → Show private key
3. Enter password and copy key
4. Must be authorized oracle on contract

**PINATA_JWT:**
1. Go to https://app.pinata.cloud/
2. Sign up/login
3. API Keys → New Key
4. Copy JWT token

---

## 🌐 Network Details

- **Contract:** 0xCb93B233CFF21498eefF6bD713341494aa0406f5
- **Network:** XRP EVM Testnet
- **Chain ID:** 1449000
- **RPC:** https://rpc.testnet.xrplevm.org
- **Explorer:** https://explorer.testnet.xrplevm.org
- **Faucet:** https://faucet.xrplevm.org/

---

## 📡 API Flow

```
┌─────────────────┐
│  User Frontend  │
│  (Port 3000)    │
└────────┬────────┘
         │
         │ (1) Collect HR data
         │
         ↓
┌─────────────────┐
│  POST /api/     │
│  attest         │
│  {user_id,      │
│   hr_samples}   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Backend        │
│  (Port 3001)    │
│                 │
│  ┌───────────┐  │
│  │ Analyze   │  │ (2) Fraud detection
│  │ Engine    │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │ Pinata    │  │ (3) Store on IPFS
│  │ Storage   │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │ EVM       │  │ (4) Submit to blockchain
│  │ Submitter │  │
│  └───────────┘  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  XRP EVM        │
│  Sidechain      │
└────────┬────────┘
         │
         │ (5) Transaction confirmed
         │
         ↓
┌─────────────────┐
│  Response:      │
│  - tx_hash      │
│  - ipfs_hash    │
│  - explorer_url │
│  - confidence   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  User Frontend  │
│  Display Result │
└─────────────────┘
```

---

## 🧪 Testing

### Test Frontend
```bash
# Start frontend
npm run dev

# Open browser
open http://localhost:3000

# Steps:
1. Click "Connect Wallet"
2. Approve MetaMask connection
3. MetaMask switches to XRP EVM Testnet
4. Submit test attestation
5. Approve transaction in MetaMask
6. View result and explorer link
```

### Test Backend
```bash
# Start backend
npm run dev

# Test analyze endpoint
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "hr_samples": [
      {"timestamp": "2024-01-01T10:00:00Z", "bpm": 120},
      {"timestamp": "2024-01-01T10:00:05Z", "bpm": 125},
      {"timestamp": "2024-01-01T10:00:10Z", "bpm": 130}
    ]
  }'

# Test attest endpoint
curl -X POST http://localhost:3001/api/attest \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B",
    "hr_samples": [...]
  }'
```

### Test Full Stack
```bash
# 1. Start backend (terminal 1)
cd backend
npm run dev

# 2. Start frontend (terminal 2)
cd frontend
npm run dev

# 3. Open browser
open http://localhost:3000

# 4. Complete flow:
- Connect wallet
- Submit attestation
- Backend analyzes
- Backend stores on IPFS
- Backend submits to blockchain
- Frontend displays result
```

---

## 🎓 For Kiro AI

### Frontend Integration Prompt
```
I have a blockchain integration package at blockchain-integration/. 
Read blockchain-integration/INTEGRATION_GUIDE.md and integrate it into this frontend.
The package provides MetaMask wallet connection and XRP EVM attestation submission.
```

### Backend Integration Prompt
```
I have a backend package at backend-integration/. 
Read backend-integration/INTEGRATION_GUIDE.md and set it up.
The package provides fraud detection, IPFS storage, and blockchain submission.
```

### Full Stack Integration Prompt
```
I have two integration packages:
1. blockchain-integration/ - Frontend blockchain integration
2. backend-integration/ - Backend oracle service

First, read backend-integration/INTEGRATION_GUIDE.md and set up the backend.
Then, read blockchain-integration/INTEGRATION_GUIDE.md and integrate the frontend.
Connect the frontend to the backend API at http://localhost:3001.
```

---

## 🔐 Security Checklist

### Frontend
- [ ] No private keys in code
- [ ] User signs all transactions
- [ ] MetaMask handles key management
- [ ] Contract address is public (safe)
- [ ] RPC URL is public (safe)
- [ ] Environment variables use NEXT_PUBLIC_ prefix

### Backend
- [ ] Oracle private key in .env file
- [ ] .env file in .gitignore
- [ ] Never commit private keys
- [ ] Use HTTPS in production
- [ ] Add rate limiting in production
- [ ] Deploy in TEE for production
- [ ] Restrict CORS origins in production

---

## 📊 Package Comparison

| Feature | Frontend | Backend |
|---------|----------|---------|
| **Purpose** | Wallet + Blockchain | Oracle + IPFS |
| **Tech** | React + ethers.js | Node.js + Hono |
| **Dependencies** | 1 (ethers) | 5 (hono, ethers, etc) |
| **Lines of Code** | ~500 | ~1200 |
| **Integration Time** | ~5 min | ~10 min |
| **Requires Credentials** | No | Yes (private key, JWT) |
| **User Interaction** | Yes (MetaMask) | No (API only) |
| **Blockchain Writes** | Yes (user signs) | Yes (oracle signs) |

---

## 🎯 Common Use Cases

### Use Case 1: Add to Existing dApp
**Need:** blockchain-integration/
**Steps:**
1. Copy frontend package
2. Wrap app with WalletProvider
3. Use useAttestation hook
4. Display results

### Use Case 2: Build Oracle Service
**Need:** backend-integration/
**Steps:**
1. Copy backend package
2. Configure environment
3. Start server
4. Expose API endpoints

### Use Case 3: Complete Integration
**Need:** Both packages
**Steps:**
1. Setup backend first
2. Setup frontend
3. Connect via API
4. Test end-to-end

### Use Case 4: Custom Frontend
**Need:** backend-integration/ + custom frontend
**Steps:**
1. Setup backend
2. Build custom frontend
3. Call backend API
4. Handle responses

---

## 🚨 Troubleshooting

### Frontend Issues

**"MetaMask not installed"**
- User needs to install MetaMask extension
- Provide link: https://metamask.io

**"Wrong network"**
- WalletProvider auto-switches networks
- If fails, user must add network manually

**"Transaction failed"**
- Check user has testnet XRP
- Get from faucet: https://faucet.xrplevm.org/

### Backend Issues

**"ORACLE_PRIVATE_KEY not set"**
- Add to .env.development.local
- Must be authorized oracle on contract

**"Pinata upload failed"**
- Check PINATA_JWT is correct
- Verify Pinata account has quota
- Backend will fallback to mock mode

**"Contract call failed"**
- Verify contract address
- Check RPC URL is accessible
- Ensure oracle has gas (testnet XRP)

---

## 📈 Next Steps

1. **Choose your integration path** (A, B, C, or D above)
2. **Copy the relevant package(s)**
3. **Follow the integration guide**
4. **Test the integration**
5. **Deploy to production**

---

## 📞 Support

**Documentation:**
- PACKAGES_SUMMARY.md - Visual overview
- blockchain-integration/INTEGRATION_GUIDE.md - Frontend details
- backend-integration/INTEGRATION_GUIDE.md - Backend details
- PACKAGE_VERIFICATION.md - Verification checklist

**Network:**
- Explorer: https://explorer.testnet.xrplevm.org
- Faucet: https://faucet.xrplevm.org/
- RPC: https://rpc.testnet.xrplevm.org

---

## ✅ Ready to Integrate

Both packages are:
- ✓ Complete and tested
- ✓ Fully documented
- ✓ Production ready
- ✓ Kiro AI friendly
- ✓ Copy-paste ready

**Let's build!** 🚀
