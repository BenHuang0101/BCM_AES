const hre = require("hardhat");

async function main() {
    console.log("部署開始...");

    const oracleAddress = "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"; // 時間預言機地址
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
