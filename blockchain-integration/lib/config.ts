// XRP EVM Network Configuration
export const XRP_EVM_CONFIG = {
  // Network Details
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1449000"),
  chainIdHex: `0x${parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1449000").toString(16)}`,
  networkName: "XRP EVM Sidechain Testnet",
  
  // RPC & Explorer
  rpcUrl: process.env.NEXT_PUBLIC_XRP_EVM_RPC_URL || "https://rpc.testnet.xrplevm.org",
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.testnet.xrplevm.org",
  
  // Smart Contract
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xCb93B233CFF21498eefF6bD713341494aa0406f5",
  
  // Currency
  nativeCurrency: {
    name: "XRP",
    symbol: "XRP",
    decimals: 18,
  },
  
  // Faucet
  faucetUrl: "https://faucet.xrplevm.org/",
};

// For React (non-Next.js) projects, use REACT_APP_ prefix
export const getConfig = () => {
  if (typeof window === "undefined") {
    return XRP_EVM_CONFIG;
  }

  // Try NEXT_PUBLIC_ first, fallback to REACT_APP_
  return {
    ...XRP_EVM_CONFIG,
    chainId: parseInt(
      process.env.NEXT_PUBLIC_CHAIN_ID || 
      process.env.REACT_APP_CHAIN_ID || 
      "1449000"
    ),
    rpcUrl: 
      process.env.NEXT_PUBLIC_XRP_EVM_RPC_URL || 
      process.env.REACT_APP_XRP_EVM_RPC_URL || 
      "https://rpc.testnet.xrplevm.org",
    explorerUrl: 
      process.env.NEXT_PUBLIC_EXPLORER_URL || 
      process.env.REACT_APP_EXPLORER_URL || 
      "https://explorer.testnet.xrplevm.org",
    contractAddress: 
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 
      process.env.REACT_APP_CONTRACT_ADDRESS || 
      "0xCb93B233CFF21498eefF6bD713341494aa0406f5",
  };
};
