// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LandRegistry {
    struct Title {
        address owner;
        string parcelId;
        string metadataURI;
        bytes32 docHash;
        bool valid;
    }

    mapping(uint256 => Title) public titles;
    mapping(string => uint256) public parcelToTokenId;
    mapping(uint256 => address) public transferRequests;

    address public registrar;
    uint256 public nextId;

    event TitleIssued(uint256 indexed tokenId, address indexed owner, string parcelId);
    event TransferRequested(uint256 indexed tokenId, address indexed from, address indexed to);
    event TransferApproved(uint256 indexed tokenId, address indexed newOwner);
    event TitleRevoked(uint256 indexed tokenId, string reason);

    modifier onlyRegistrar() {
        require(msg.sender == registrar, "Not registrar");
        _;
    }

    modifier onlyOwner(uint256 tokenId) {
        require(msg.sender == titles[tokenId].owner, "Not owner");
        _;
    }

    constructor(address initialRegistrar) {
        registrar = initialRegistrar;
        nextId = 1;
    }

    function issueTitle(address to, string memory parcelId, string memory metadataURI, bytes32 docHash) external onlyRegistrar {
        require(parcelToTokenId[parcelId] == 0, "Parcel exists");
        uint256 tokenId = nextId++;
        titles[tokenId] = Title(to, parcelId, metadataURI, docHash, true);
        parcelToTokenId[parcelId] = tokenId;
        emit TitleIssued(tokenId, to, parcelId);
    }

    function requestTransfer(uint256 tokenId, address to) external onlyOwner(tokenId) {
        require(titles[tokenId].valid, "Invalid title");
        transferRequests[tokenId] = to;
        emit TransferRequested(tokenId, msg.sender, to);
    }

    function approveTransfer(uint256 tokenId) external onlyRegistrar {
        address newOwner = transferRequests[tokenId];
        require(newOwner != address(0), "No request");
        titles[tokenId].owner = newOwner;
        transferRequests[tokenId] = address(0);
        emit TransferApproved(tokenId, newOwner);
    }

    function revokeTitle(uint256 tokenId, string memory reason) external onlyRegistrar {
        titles[tokenId].valid = false;
        emit TitleRevoked(tokenId, reason);
    }

    function verifyParcelOwner(string memory parcelId) external view returns (address) {
        uint256 tokenId = parcelToTokenId[parcelId];
        require(tokenId != 0, "Parcel not found");
        return titles[tokenId].owner;
    }
}
