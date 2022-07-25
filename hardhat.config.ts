import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import "solidity-coverage";

import * as dotenv from "dotenv";
dotenv.config();

const chainIds = {
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
  mumbai: 80001,
  polygon: 137,
};

const PRIVATE_KEY = process.env.PK || "";
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || "";
const MNEMONIC_SEED = process.env.MNEMONIC_SEED || "";

const config = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // accounts: {
      //   mnemonic: MNEMONIC_SEED || ''
      // },
      // blockGasLimit: 30000000,
      // forking: {
      //   url: "https://andromeda.metis.io/?owner=1088"
      // }
    },
    stardust: {
      url: "https://stardust.metis.io/?owner=588",
      accounts: [PRIVATE_KEY],
      chainId: 588,
      gasMultiplier: 1.25
    },
    andromeda: {
      url: "https://andromeda.metis.io/?owner=1088",
      accounts: [PRIVATE_KEY],
      chainId: 1088,
      gasMultiplier: 1.25
    }
  },
  etherscan: {
    apiKey: {
      metisAndromeda: ETHERSCAN_KEY,
      metisStardust: ETHERSCAN_KEY,
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 30000,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  }
};

export default config;
