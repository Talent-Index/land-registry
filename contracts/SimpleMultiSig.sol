// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleMultiSig {
    uint256 public threshold;
    address[] public owners;
    mapping(address => bool) public isOwner;

    struct Tx {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    Tx[] public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmed;

    event SubmitTx(uint256 indexed txId, address indexed to, uint256 value, bytes data);
    event ConfirmTx(uint256 indexed txId, address indexed by);
    event ExecuteTx(uint256 indexed txId, address indexed by);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    constructor(address[] memory _owners, uint256 _threshold) {
        require(_owners.length > 0, "Owners required");
        require(_threshold > 0 && _threshold <= _owners.length, "Invalid threshold");
        threshold = _threshold;
        for (uint i = 0; i < _owners.length; i++) {
            address o = _owners[i];
            require(o != address(0), "Zero owner");
            require(!isOwner[o], "Duplicate owner");
            isOwner[o] = true;
            owners.push(o);
        }
    }

    function submitTx(address to, uint256 value, bytes calldata data) external onlyOwner returns (uint256) {
        transactions.push(Tx({to: to, value: value, data: data, executed: false, confirmations: 0}));
        uint256 txId = transactions.length - 1;
        emit SubmitTx(txId, to, value, data);
        return txId;
    }

    function confirmTx(uint256 txId) external onlyOwner {
        require(txId < transactions.length, "Tx not found");
        require(!confirmed[txId][msg.sender], "Already confirmed");
        Tx storage t = transactions[txId];
        require(!t.executed, "Already executed");

        confirmed[txId][msg.sender] = true;
        t.confirmations += 1;
        emit ConfirmTx(txId, msg.sender);

        if (t.confirmations >= threshold) {
            _executeTx(txId);
        }
    }

    function _executeTx(uint256 txId) internal {
        Tx storage t = transactions[txId];
        require(!t.executed, "Already executed");
        t.executed = true;
        (bool success,) = t.to.call{value: t.value}(t.data);
        require(success, "tx failed");
        emit ExecuteTx(txId, msg.sender);
    }

    receive() external payable {}
}
