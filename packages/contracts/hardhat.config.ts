import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const baseSepoliaRpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
const normalizedDeployerPrivateKey = deployerPrivateKey
  ? deployerPrivateKey.startsWith("0x")
    ? deployerPrivateKey
    : `0x${deployerPrivateKey}`
  : undefined;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    baseSepolia: {
      url: baseSepoliaRpcUrl ?? "",
      accounts: normalizedDeployerPrivateKey ? [normalizedDeployerPrivateKey] : [],
      chainId: 84532,
    },
  },
};

export default config;
