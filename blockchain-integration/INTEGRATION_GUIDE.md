# Integration Guide: XRP EVM Blockchain Package

## For Kiro AI Assistant

This guide helps you integrate the XRP EVM blockchain package into a new frontend project.

---

## Step 1: Copy Files

Copy the entire `blockchain-integration` folder into the target frontend:

```bash
# If using Next.js (app router)
cp -r blockchain-integration /path/to/frontend/src/

# If using Next.js (pages router)
cp -r blockchain-integration /path/to/frontend/src/

# If using React (CRA/Vite)
cp -r blockchain-integration /path/to/frontend/src/
```

---

## Step 2: Install Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "ethers": "^6.0.0"
  }
}
```

Run:
```bash
npm install ethers@^6.0.0
```

---

## Step 3: Environment Variables

Create `.env.local` (Next.js) or `.env` (React):

```env
# XRP EVM Configuration
NEXT_PUBLIC_XRP_EVM_RPC_URL=https://rpc.testnet.xrplevm.org
NEXT_PUBLIC_CONTRACT_ADDRESS=0xCb93B233CFF21498eefF6bD713341494aa0406f5
NEXT_PUBLIC_CHAIN_ID=1449000
NEXT_PUBLIC_EXPLORER_URL=https://explorer.testnet.xrplevm.org
```

**Note:** For React (non-Next.js), use `REACT_APP_` prefix instead of `NEXT_PUBLIC_`

---

## Step 4: Wrap Application with Provider

### Next.js (App Router)
```tsx
// app/layout.tsx
import { WalletProvider } from '@/blockchain-integration/providers/WalletProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
```

### Next.js (Pages Router)
```tsx
// pages/_app.tsx
import { WalletProvider } from '@/blockchain-integration/providers/WalletProvider';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
```

### React (CRA/Vite)
```tsx
// src/App.tsx or src/main.tsx
import { WalletProvider } from './blockchain-integration/providers/WalletProvider';

function App() {
  return (
    <WalletProvider>
      {/* Your app components */}
    </WalletProvider>
  );
}
```

---

## Step 5: Use in Components

### Basic Wallet Connection
```tsx
import { useWallet } from '@/blockchain-integration/providers/WalletProvider';
import { ConnectWallet } from '@/blockchain-integration/components/ConnectWallet';

function MyComponent() {
  const { address, isConnected } = useWallet();

  return (
    <div>
      <ConnectWallet />
      {isConnected && <p>Connected: {address}</p>}
    </div>
  );
}
```

### Submit Attestation
```tsx
import { useAttestation } from '@/blockchain-integration/hooks/useAttestation';
import type { AttestationData } from '@/blockchain-integration/lib/types';

function SubmitForm() {
  const { submitAttestation, isLoading, error } = useAttestation();

  const handleSubmit = async () => {
    try {
      const attestationData: AttestationData = {
        activityType: "high_intensity_cardio",
        durationMins: 25,
        avgHr: 145,
        maxHr: 177,
        minHr: 93,
        hrZoneDistribution: {
          zone1_rest: 10,
          zone2_light: 20,
          zone3_moderate: 30,
          zone4_vigorous: 25,
          zone5_max: 15
        },
        recoveryScore: 85,
        confidence: 95,
        dataHash: "0x1234...", // From your backend
        ipfsHash: "Qm..."      // From your backend
      };

      const result = await submitAttestation(attestationData);
      
      console.log("Success!");
      console.log("TX Hash:", result.txHash);
      console.log("Block:", result.blockNumber);
      console.log("Explorer:", result.explorerUrl);
      console.log("Attestation Key:", result.attestationKey);
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Submitting..." : "Submit Attestation"}
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

---

## Step 6: Display Results

```tsx
import { AttestationResult } from '@/blockchain-integration/components/AttestationResult';

function ResultPage() {
  const result = {
    txHash: "0x...",
    blockNumber: 12345,
    explorerUrl: "https://explorer.testnet.xrplevm.org/tx/0x...",
    attestationKey: "0x2B65...DEF9B:1234567890",
    confidence: 95
  };

  return <AttestationResult data={result} />;
}
```

---

## Common Integration Patterns

### Pattern 1: Connect Wallet Button in Header
```tsx
// components/Header.tsx
import { useWallet } from '@/blockchain-integration/providers/WalletProvider';

export function Header() {
  const { address, connect, disconnect, isConnected } = useWallet();

  return (
    <header>
      <nav>
        {!isConnected ? (
          <button onClick={connect}>Connect Wallet</button>
        ) : (
          <div>
            <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            <button onClick={disconnect}>Disconnect</button>
          </div>
        )}
      </nav>
    </header>
  );
}
```

### Pattern 2: Protected Route (Requires Wallet)
```tsx
import { useWallet } from '@/blockchain-integration/providers/WalletProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ProtectedPage() {
  const { isConnected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/connect');
    }
  }, [isConnected, router]);

  if (!isConnected) return null;

  return <div>Protected content</div>;
}
```

### Pattern 3: Integration with Backend API
```tsx
import { useAttestation } from '@/blockchain-integration/hooks/useAttestation';

async function submitWorkout(workoutData: any) {
  // 1. Send to your backend for analysis
  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: JSON.stringify(workoutData)
  });
  
  const { attestation, ipfsHash, dataHash } = await response.json();

  // 2. Submit to blockchain
  const { submitAttestation } = useAttestation();
  const result = await submitAttestation({
    ...attestation,
    ipfsHash,
    dataHash
  });

  return result;
}
```

---

## Troubleshooting

### Issue: "Cannot find module '@/blockchain-integration/...'"

**Solution:** Update import paths based on your project structure:
```tsx
// If blockchain-integration is in src/
import { useWallet } from '@/blockchain-integration/providers/WalletProvider';

// If blockchain-integration is in src/lib/
import { useWallet } from '@/lib/blockchain-integration/providers/WalletProvider';

// If using relative imports
import { useWallet } from '../blockchain-integration/providers/WalletProvider';
```

### Issue: "process is not defined" (Vite/React)

**Solution:** Add to `vite.config.ts`:
```ts
export default defineConfig({
  define: {
    'process.env': {}
  }
});
```

### Issue: "window.ethereum is undefined"

**Solution:** User needs MetaMask installed. Show install prompt:
```tsx
const { isInstalled } = useWallet();

if (!isInstalled) {
  return (
    <div>
      <p>MetaMask not detected</p>
      <a href="https://metamask.io" target="_blank">
        Install MetaMask
      </a>
    </div>
  );
}
```

### Issue: "Wrong network" error

**Solution:** The WalletProvider auto-switches networks. If it fails:
```tsx
const { chainId } = useWallet();

if (chainId !== 1449000) {
  return <p>Please switch to XRP EVM Testnet in MetaMask</p>;
}
```

---

## Testing Checklist

- [ ] WalletProvider wraps app correctly
- [ ] Connect wallet button works
- [ ] MetaMask prompts for connection
- [ ] Network auto-switches to XRP EVM Testnet
- [ ] Address displays after connection
- [ ] Submit attestation triggers MetaMask
- [ ] Transaction confirms on blockchain
- [ ] Explorer link opens correct transaction
- [ ] Disconnect wallet works
- [ ] Error messages display properly

---

## API Backend Integration

Your backend should provide:

```typescript
// POST /api/analyze
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
  "ipfsHash": "Qm...",
  "hr_timeline": [...]
}
```

Then frontend submits to blockchain:
```typescript
const result = await submitAttestation({
  ...attestation,
  ipfsHash,
  dataHash: attestation.data_hash
});
```

---

## Next Steps

1. Test wallet connection
2. Test attestation submission
3. Verify transactions on explorer
4. Customize UI components
5. Add error handling
6. Add loading states
7. Add success notifications

---

## Support

If you encounter issues:
1. Check console for errors
2. Verify environment variables
3. Confirm MetaMask is installed
4. Check network is XRP EVM Testnet
5. Verify contract address is correct
6. Test RPC URL accessibility

---

**Ready to integrate!** 🚀
