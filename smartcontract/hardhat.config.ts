import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from parent directory (or local)
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config(); // Fallback to local .env

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.EVMRPC_URL || "https://evmrpc-testnet.0g.ai";

if (!PRIVATE_KEY) {
  console.warn("⚠️ Please set your PRIVATE_KEY in the .env file");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "none",
      },
    },
  },
  networks: {
    "0g-galileo-testnet": {
      url: RPC_URL,
      chainId: 16602,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`] : [],
      gas: "auto",
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      "0g-galileo-testnet": "placeholder",
    },
    customChains: [
      {
        network: "0g-galileo-testnet",
        chainId: 16602,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/open/api",
          browserURL: "https://chainscan-galileo.0g.ai",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;