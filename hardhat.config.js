require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();


//先建立env檔 將url & private key存入
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    polygon_amoy: {
      url: process.env.ALCHEMY_API_URL_AMOY,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon_mainnet: {
      url: process.env.ALCHEMY_API_URL_MAINNET, //  Alchemy 的 Polygon 主網 RPC
      accounts: [process.env.PRIVATE_KEY], // 錢包的private key
      gasPrice: 150000000000, // 150 Gwei
    }
  }
};



