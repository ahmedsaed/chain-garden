require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";

const config = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
};

// Only add networks when a valid private key is set
if (PRIVATE_KEY && PRIVATE_KEY.length === 64) {
  config.networks = {
    base: {
      url: process.env.BASE_RPC || "https://mainnet.base.org",
      accounts: [PRIVATE_KEY],
    },
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: [PRIVATE_KEY],
    },
  };
}

if (BASESCAN_API_KEY) {
  config.etherscan = {
    apiKey: { base: BASESCAN_API_KEY },
    customChains: [{
      network: "base",
      chainId: 8453,
      urls: { apiURL: "https://api.basescan.org/api", browserURL: "https://basescan.org" },
    }],
  };
}

module.exports = config;
