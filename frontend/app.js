const contractAddress = "0xC7e0fE16314C4ad95ee9C059357eb23eEb3eC8E6"; //你的合約地址
const contractABI = [
    {
        "inputs": [{ "internalType": "address", "name": "_oracleAddress", "type": "address" }],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "patientID", "type": "string" },
            { "internalType": "string", "name": "ipfsHash", "type": "string" }
        ],
        "name": "addRecord",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "doctor", "type": "address" },
            { "internalType": "string", "name": "patientID", "type": "string" }
        ],
        "name": "getRecord",
        "outputs": [
            { "internalType": "string", "name": "", "type": "string" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    //-----------fix-------------
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "doctor", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "patientID", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "name": "RecordAdded",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "getLatestPrice",
        "outputs": [
            {
                "internalType": "int256",
                "name": "",
                "type": "int256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

async function connectMetaMask() {
    if (window.ethereum) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        window.provider = new ethers.providers.Web3Provider(window.ethereum);
        window.signer = provider.getSigner();
        window.contract = new ethers.Contract(contractAddress, contractABI, signer);
    } else {
        alert("請安裝 MetaMask");
    }
}

async function uploadRecord() {
    await connectMetaMask();

    const patientID = document.getElementById("patientID").value;
    const medicalRecord = document.getElementById("medicalRecord").value;

    const encryptionKey = CONFIG.AES_SECRET_KEY;

    // 加密病歷內容
    const encryptedRecord = CryptoJS.AES.encrypt(medicalRecord, encryptionKey).toString();

    // 上傳到 IPFS
    const pinataApiKey = "83af6b3d3de22a02dfbf";
    const pinataSecretApiKey = CONFIG.PINATA_SECRET_APIKEY;
    const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

    const data = JSON.stringify({
        pinataContent: {
            patientID: patientID,
            encryptedRecord: encryptedRecord
        },
        pinataMetadata: {
            name: "MedicalRecord_" + patientID
        }
    });

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "pinata_api_key": pinataApiKey,
            "pinata_secret_api_key": pinataSecretApiKey
        },
        body: data
    });

    const result = await response.json();
    const ipfsHash = result.IpfsHash;

    document.getElementById("uploadStatus").innerText = `IPFS Hash: ${ipfsHash}`;

    // 呼叫智能合約，把 IPFS Hash 存入區塊鏈
    const tx = await contract.addRecord(patientID, ipfsHash);
    await tx.wait();

    alert("病歷上傳成功！（已加密）");
}


async function fetchRecord() {
    await connectMetaMask();

    const patientID = document.getElementById("searchPatientID").value;
    const doctorAddress = await signer.getAddress();

    try {
        // 查詢病歷
        const eventFilter = contract.filters.RecordAdded(doctorAddress, null);
        const events = await contract.queryFilter(eventFilter);

        if (events.length === 0) {
            document.getElementById("recordResult").innerText = "找不到病歷！";
            return;
        }

        let recordsHTML = "<h3>病歷列表：</h3>";
        const recordsData = []; // 儲存病歷資料供 PDF 使用

        for (const event of events) {
            const eventArgs = event.args;
            if (!eventArgs || eventArgs.patientID !== patientID) continue;

            const ipfsHash = eventArgs.ipfsHash;
            const timestamp = eventArgs.timestamp.toNumber();
            const formattedTime = new Date(timestamp * 1000).toLocaleString();

            // 從 IPFS 取得病歷內容
            const ipfsUrl = `https://dweb.link/ipfs/${ipfsHash}`;
            const response = await fetch(ipfsUrl);
            const ipfsData = await response.json();
            const encryptedRecord = ipfsData.encryptedRecord;

            // 解密病歷
            const encryptionKey = CONFIG.AES_SECRET_KEY;
            const decryptedRecord = CryptoJS.AES.decrypt(encryptedRecord, encryptionKey).toString(CryptoJS.enc.Utf8);

            recordsHTML += `
                <div class="record">
                    <p><strong>病歷內容：</strong> ${decryptedRecord}</p>
                    <p><strong>IPFS CID：</strong> <a href="${ipfsUrl}" target="_blank">${ipfsHash}</a></p>
                </div>
                <hr>
            `;
        }

        document.getElementById("recordResult").innerHTML = recordsHTML || "找不到符合條件的病歷！";

    } catch (error) {
        console.error("查詢病歷時發生錯誤:", error);
        document.getElementById("recordResult").innerText = "查詢失敗，請稍後再試！";
    }
}

let exchangeRateChart; // 存放 Chart.js 的實例
let chartData = []; // 存放匯率的歷史數據
let chartLabels = []; // 存放時間戳作為 X 軸標籤

// 初始化匯率圖表
function initChart() {
    const ctx = document.getElementById('exchangeRateChart').getContext('2d');
    exchangeRateChart = new Chart(ctx, {
        type: 'line', // 曲線圖
        data: {
            labels: chartLabels, // X 軸標籤（時間）
            datasets: [
                {
                    label: 'ETH/USD 匯率',
                    data: chartData, // Y 軸數據（匯率）
                    borderColor: 'rgb(0, 0, 0,1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    tension: 0.3, // 曲線的平滑程度
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '時間',
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'ETH/USD 匯率',
                    },
                    beginAtZero: false,
                },
            },
        },
    });
}

let previousRate = 0; // 用於記錄上一個匯率
// 查詢匯率並更新圖表
async function fetchAndUpdateChart() {
    try {
        await connectMetaMask(); // 確保 MetaMask 已連接

        // 查詢匯率
        const price = await contract.getLatestPrice();
        const formattedPrice = (price.toNumber() / 1e8).toFixed(2); // 格式化為 2 位小數

        // 更新即時匯率數字
        const rateElement = document.getElementById("currentRate");
        const arrowElement = document.getElementById("rateArrow");

        rateElement.innerText = `$${formattedPrice}`;

        // 比較新舊匯率，顯示箭頭
        if (previousRate !== null) {
            if (formattedPrice > previousRate) {
                arrowElement.innerHTML = "&#9650;"; // 上升箭頭
                arrowElement.style.color = "red";  // 紅色
            } else if (formattedPrice < previousRate) {
                arrowElement.innerHTML = "&#9660;"; // 下降箭頭
                arrowElement.style.color = "green"; // 綠色
            } else {
                arrowElement.innerHTML = ""; // 無變化，不顯示箭頭
            }
        }

        // 更新上一個匯率
        previousRate = formattedPrice;

        // 獲取當前時間作為標籤
        const currentTime = new Date().toLocaleTimeString();

        // 更新圖表數據
        chartLabels.push(currentTime);
        chartData.push(formattedPrice);

        // 限制最多顯示 10 個點（選擇性）
        if (chartLabels.length > 10) {
            chartLabels.shift();
            chartData.shift();
        }

        // 更新圖表
        exchangeRateChart.update();
    } catch (error) {
        console.error('查詢匯率時發生錯誤:', error);
        document.getElementById("currentRate").innerText = "查詢失敗";
        document.getElementById("rateArrow").innerHTML = ""; // 清空箭頭
    }
}


// 自動每 5 秒更新匯率
function startAutoUpdateChart() {
    fetchAndUpdateChart(); // 初始化時立即執行一次
    setInterval(fetchAndUpdateChart, 5000); // 每 5 秒執行一次
    console.log(previousRate);
}

// 頁面加載完成後啟動圖表
window.onload = () => {
    initChart(); // 初始化圖表
    startAutoUpdateChart(); // 啟動自動更新
};











