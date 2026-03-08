const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const RPC_URL = "https://rpc.testnet.xrplevm.org";
const PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("ERROR: Set ORACLE_PRIVATE_KEY environment variable");
  process.exit(1);
}

async function main() {
  const contractPath = path.join(__dirname, "..", "contracts", "InsuranceWellnessDAO.sol");
  const source = fs.readFileSync(contractPath, "utf-8");

  console.log("Compiling InsuranceWellnessDAO with viaIR + optimizer...");

  const input = JSON.stringify({
    language: "Solidity",
    sources: {
      "InsuranceWellnessDAO.sol": { content: source },
    },
    settings: {
      viaIR: true,
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  });

  const output = JSON.parse(solc.compile(input));

  if (output.errors) {
    const fatal = output.errors.filter(e => e.severity === "error");
    if (fatal.length > 0) {
      console.error("Compilation errors:");
      fatal.forEach(e => console.error(e.formattedMessage));
      process.exit(1);
    }
  }

  const contract = output.contracts["InsuranceWellnessDAO.sol"]["InsuranceWellnessDAO"];
  const abi = contract.abi;
  const bin = contract.evm.bytecode.object;

  console.log("Compiled successfully.");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} XRP`);

  if (balance === 0n) {
    console.error("ERROR: No funds.");
    process.exit(1);
  }

  console.log("Deploying InsuranceWellnessDAO...");
  const factory = new ethers.ContractFactory(abi, "0x" + bin, wallet);
  const deployed = await factory.deploy([]);
  console.log(`Tx: ${deployed.deploymentTransaction().hash}`);

  await deployed.waitForDeployment();
  const addr = await deployed.getAddress();
  console.log(`\nContract deployed at: ${addr}`);
  console.log(`Explorer: https://explorer.testnet.xrplevm.org/address/${addr}`);

  // Set minVotingPeriod to 120 seconds for demo
  console.log("\nSetting minVotingPeriod to 120s for demo...");
  const contractInstance = new ethers.Contract(addr, abi, wallet);
  const tx = await contractInstance.setMinVotingPeriod(120);
  await tx.wait();
  console.log("Done! minVotingPeriod = 120 seconds.");

  console.log(`\nAdd to .env.local:\nNEXT_PUBLIC_INSURANCE_DAO_ADDRESS=${addr}`);
}

main().catch(console.error);
