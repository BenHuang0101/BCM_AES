const hre = require("hardhat");

async function main() {
    console.log("部署開始...");

    const oracleAddress = "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"; // 時間預言機地址
    //const priceFeedAddress = "0x327e23A4855b6F663a28c5161541d69Af8973302"; // 匯率預言機地址
    const priceFeedAddress = "0xF9680D99D6C9589e2a93a78A04A279e509205945"; //匯率預言機

    const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
    console.log("合約工廠創建成功");

    const medicalRecords = await MedicalRecords.deploy(oracleAddress, priceFeedAddress);
    console.log("合約部署進行中...");

    console.log("MedicalRecords 部署成功，合約地址:", medicalRecords.target);
}

main().catch((error) => {
    console.error("部署失敗:", error);
    process.exitCode = 1;
});


/*
async function main() {
    // 指定 Chainlink Oracle 地址（Polygon PoS Amoy 測試鏈）
    //const oracleAddress = "0x12162c3E810393dEC01362aBf156D7ecf6159528";

    const timeOracleAddress = "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"; //時間預言機地址
    const priceFeedAddress = "0x327e23A4855b6F663a28c5161541d69Af8973302"; // 匯率預言機地址
    //const oracleAddress = "0x1F8A24289D539DfDC00C0C02Fd6800196EbfAB9B";

    // 部署合約
    const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
    const medicalRecords = await MedicalRecords.deploy(timeOracleAddress, priceFeedAddress);

    // 等待合約成功部署
    await medicalRecords.waitForDeployment();

    console.log(`MedicalRecords 部署成功！合約地址： ${medicalRecords.target}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
*/
