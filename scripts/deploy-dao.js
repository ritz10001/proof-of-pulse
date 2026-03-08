const { ethers } = require("ethers");
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const RPC_URL = "https://rpc.testnet.xrplevm.org";
const PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("ERROR: Set ORACLE_PRIVATE_KEY environment variable");
  console.error("Usage: ORACLE_PRIVATE_KEY=0x... node scripts/deploy-dao.js");
  process.exit(1);
}

async function main() {
  // Compile using solcjs
  const contractPath = path.join(__dirname, "..", "contracts", "ChallengeRewardDAO.sol");
  const outDir = path.join(__dirname, "..", "contracts", "out");

  console.log("Compiling contract...");
  execSync(`solcjs --bin --abi -o "${outDir}" "${contractPath}"`, { encoding: "utf-8" });

  // solcjs outputs files with mangled names
  const files = fs.readdirSync(outDir);
  const binFile = files.find(f => f.endsWith(".bin") && f.includes("ChallengeRewardDAO"));
  const abiFile = files.find(f => f.endsWith(".abi") && f.includes("ChallengeRewardDAO"));

  if (!binFile || !abiFile) {
    console.error("Compilation failed - output files not found");
    console.error("Files in output:", files);
    process.exit(1);
  }

  const bin = fs.readFileSync(path.join(outDir, binFile), "utf-8");
  const abi = JSON.parse(fs.readFileSync(path.join(outDir, abiFile), "utf-8"));

  // Deploy
  console.log("Connecting to XRP EVM Testnet...");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} XRP`);

  if (balance === 0n) {
    console.error("ERROR: Deployer has no funds. Get testnet XRP from faucet.");
    process.exit(1);
  }

  console.log("Deploying ChallengeRewardDAO...");
  const factory = new ethers.ContractFactory(abi, "0x" + bin, wallet);
  const contract = await factory.deploy();
  console.log(`Transaction hash: ${contract.deploymentTransaction().hash}`);

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`\nContract deployed at: ${address}`);
  console.log(`Explorer: https://explorer.testnet.xrplevm.org/address/${address}`);
  console.log(`\nAdd to .env.local:\nNEXT_PUBLIC_DAO_CONTRACT_ADDRESS=${address}`);
}

main().catch(console.error);
