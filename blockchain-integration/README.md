# XRP EVM Blockchain Integration Package

This package contains all the blockchain-specific logic for integrating Proof of Pulse attestations with XRP EVM Sidechain. It's designed to be dropped into any React/Next.js frontend.

## 📦 What's Included

```
blockchain-integration/
├── README.md                          # This file
├── INTEGRATION_GUIDE.md              # Step-by-step integration instructions
├── package.json                       # Required dependencies
├── providers/
│   └── WalletProvider.tsx            # MetaMask wallet connection
├── hooks/
│   └── useAttestation.ts             # Attestation submission hook
├── lib/
│   ├── contract.ts                   # Smart contract interaction
│   ├── types.ts                      # TypeScript types
│   └── config.ts                     # Network configuration
└── components/
    ├── ConnectWallet.tsx             # Wallet connect button
    └── AttestationResult.tsx         # Display attestation result
```

## 🚀 Quick Start

### 1. Copy Files
```bash
# Copy this entire folder into your frontend project
cp -r blockchain-integration /path/to/your/frontend/src/
```

### 2. Install Dependencies
```bash
npm install ethers@^6.0.0
```

### 3. Add Environment Variables
Create `.env.local` in your frontend root:
```env
NEXT_PUBLIC_XRP_EVM_RPC_URL=https://rpc.testnet.xrplevm.org
NEXT_PUBLIC_CONTRACT_ADDRESS=0xCb93B233CFF21498eefF6bD713341494aa0406f5
NEXT_PUBLIC_CHAIN_ID=1449000
```

### 4. Wrap Your App
```tsx
// app/layout.tsx or pages/_app.tsx
import { WalletProvider } from '@/blockchain-integration/providers/WalletProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
```

### 5. Use in Components
```tsx
import { useWallet } from '@/blockchain-integration/providers/WalletProvider';
import { useAttestation } from '@/blockchain-integration/hooks/useAttestation';

function MyComponent() {
  const { address, connect, isConnected } = useWallet();
  const { submitAttestation, isLoading } = useAttestation();

  const handleSubmit = async () => {
    const result = await submitAttestation({
      activityType: "high_intensity_cardio",
      durationMins: 25,
      avgHr: 145,
      maxHr: 177,
      minHr: 93,
      hrZoneDistribution: { zone1: 10, zone2: 20, zone3: 30, zone4: 25, zone5: 15 },
      recoveryScore: 85,
      confidence: 95,
      dataHash: "0x...",
      ipfsHash: "Qm..."
    });
    
    console.log("Transaction:", result.txHash);
    console.log("Explorer:", result.explorerUrl);
  };

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect MetaMask</button>
      ) : (
        <button onClick={handleSubmit} disabled={isLoading}>
          Submit Attestation
        </button>
      )}
    </div>
  );
}
```

## 📚 Full Documentation

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed integration instructions.

## 🔧 Configuration

### Network Details
- **Network:** XRP EVM Sidechain Testnet
- **Chain ID:** 1449000
- **RPC URL:** https://rpc.testnet.xrplevm.org
- **Explorer:** https://explorer.testnet.xrplevm.org
- **Contract:** 0xCb93B233CFF21498eefF6bD713341494aa0406f5

### Smart Contract ABI
The contract ABI is included in `lib/contract.ts`. Key functions:
- `submitAttestation()` - Submit new attestation
- `getAttestation()` - Retrieve attestation by key
- `verifyAttestation()` - Verify attestation meets confidence threshold

## 🐛 Troubleshooting

### "MetaMask not installed"
- User needs to install MetaMask extension
- Provide link: https://metamask.io

### "Wrong network"
- The WalletProvider auto-switches to XRP EVM Testnet
- If it fails, user needs to add network manually

### "Transaction failed"
- Check user has testnet XRP: https://faucet.xrplevm.org/
- Verify contract address is correct
- Check RPC URL is accessible

## 📝 API Reference

### WalletProvider
```tsx
interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  chainId: number | null;
}
```

### useAttestation Hook
```tsx
interface UseAttestationReturn {
  submitAttestation: (data: AttestationData) => Promise<AttestationResult>;
  isLoading: boolean;
  error: string | null;
}
```

## 🔐 Security Notes

- Never expose private keys in frontend code
- All transactions are signed by user's MetaMask
- Contract address is public and safe to expose
- RPC URL is public testnet endpoint

## 📄 License

Same as parent project
