require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition-ethers");
require("hardhat-dependency-compiler");
require('hardhat-contract-sizer');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version:"0.8.23", 
  },

  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },

  dependencyCompiler: {
    paths: [
        '@semaphore-protocol/contracts/base/Constants.sol',
        '@semaphore-protocol/contracts/base/SemaphoreVerifier.sol',
      ]
  }      
};
