// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract MedicalRecords {
    struct Record {
        string ipfsHash;
        uint256 timestamp;
    }

    mapping(address => mapping(string => Record)) private records; // doctor -> patientID -> Record
    address public owner;
    AggregatorV3Interface internal oracle; // 用於時間的 Chainlink Oracle
    AggregatorV3Interface internal priceFeed; // 用於匯率的 Chainlink Oracle

    event RecordAdded(address indexed doctor, string patientID, string ipfsHash, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor(address _oracleAddress, address _priceFeedAddress) {
        owner = msg.sender;
        oracle = AggregatorV3Interface(_oracleAddress); // 初始化時間 Oracle
        priceFeed = AggregatorV3Interface(_priceFeedAddress); // 初始化匯率 Oracle
    }

    // 新增病歷
    function addRecord(string memory patientID, string memory ipfsHash) public {
        (, int256 time, , , ) = oracle.latestRoundData();
        require(time > 0, "Invalid timestamp from oracle");
        records[msg.sender][patientID] = Record(ipfsHash, uint256(time));
        emit RecordAdded(msg.sender, patientID, ipfsHash, uint256(time));
    }

    // 獲取病歷
    function getRecord(address doctor, string memory patientID) public view returns (string memory, uint256) {
        Record memory record = records[doctor][patientID];
        require(bytes(record.ipfsHash).length > 0, "Record not found");
        return (record.ipfsHash, record.timestamp);
    }

    // 獲取匯率
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
}
