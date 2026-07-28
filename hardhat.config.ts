import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem';
import { defineConfig } from 'hardhat/config';
import noxPlugin from '@iexec-nox/nox-hardhat-plugin';
import { configVariable } from 'hardhat/config';

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin, noxPlugin],
  solidity: {
    version: '0.8.35',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    default: {
      type: 'edr-simulated',
      chainType: 'op',
    },
    sepolia: {
      type: 'http',
      chainType: 'op',
      url: 'https://ethereum-sepolia-rpc.publicnode.com',
      chainId: 11155111,
      accounts: [configVariable('SEPOLIA_PRIVATE_KEY')],
    },
  },
});
