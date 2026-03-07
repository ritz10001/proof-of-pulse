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
