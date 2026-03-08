"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { BrowserProvider } from "ethers";
import { XRP_EVM_CONFIG } from "../lib/config";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  chainId: number | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = () => {
      if (typeof window !== "undefined" && window.ethereum) {
        console.log("[MetaMask] Extension detected");
        setIsInstalled(true);
      } else {
        setIsInstalled(false);
      }
    };

    checkMetaMask();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          if (typeof window !== "undefined") {
            localStorage.setItem("wallet_address", accounts[0]);
          }
        } else {
          setAddress(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("wallet_address");
          }
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        console.log("[MetaMask] Chain changed to:", newChainId);
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    try {
      console.log("[MetaMask] Requesting accounts...");
      
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const userAddress = accounts[0];
      console.log("[MetaMask] Connected:", userAddress);
      
      setAddress(userAddress);
      if (typeof window !== "undefined") {
        localStorage.setItem("wallet_address", userAddress);
      }

      // Get current chain ID
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      // Check if on XRP EVM Testnet
      if (currentChainId !== XRP_EVM_CONFIG.chainId) {
        console.log("[MetaMask] Wrong network, switching to XRP EVM Testnet...");
        
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: XRP_EVM_CONFIG.chainIdHex }],
          });
        } catch (switchError: any) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: XRP_EVM_CONFIG.chainIdHex,
                  chainName: XRP_EVM_CONFIG.networkName,
                  nativeCurrency: XRP_EVM_CONFIG.nativeCurrency,
                  rpcUrls: [XRP_EVM_CONFIG.rpcUrl],
                  blockExplorerUrls: [XRP_EVM_CONFIG.explorerUrl],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
    } catch (error) {
      console.error("[MetaMask] Failed to connect:", error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    console.log("[MetaMask] Disconnecting");
    setAddress(null);
    setChainId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("wallet_address");
    }
  }, []);

  const value: WalletContextType = {
    address,
    isConnected: !!address,
    isInstalled,
    connect,
    disconnect,
    chainId,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
