const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry with MultiSig Registrar", function () {
  let ownerA, ownerB, ownerC, alice, bob;
  let MultiSig, LandRegistry;
  let multisig, registry;

  beforeEach(async function () {
    [ownerA, ownerB, ownerC, alice, bob] = await ethers.getSigners();

    // Deploy multisig wallet (2-of-3)
    MultiSig = await ethers.getContractFactory("SimpleMultiSig");
    multisig = await MultiSig.deploy(
      [ownerA.address, ownerB.address, ownerC.address],
      2
    );
    await multisig.deployed();

    // Fund multisig with ETH so it can execute transactions
    await ownerA.sendTransaction({
      to: multisig.address,
      value: ethers.utils.parseEther("1"),
    });

    // Deploy LandRegistry with multisig as registrar
    LandRegistry = await ethers.getContractFactory("LandRegistry");
    registry = await LandRegistry.deploy(multisig.address);
    await registry.deployed();
  });

  it("should allow multisig to issue a land title", async function () {
    const issueData = registry.interface.encodeFunctionData("issueTitle", [
      alice.address,
      "LR/KE/001",
      "ipfs://QmHash",
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("doc1")),
    ]);

    // ownerA submits a tx to issue title
    await multisig.connect(ownerA).submitTx(registry.address, 0, issueData);

    // ownerB confirms and executes (txId = 0)
    const tx = await multisig.connect(ownerB).confirmTx(0);
    await tx.wait();

    const title = await registry.titles(1);
    expect(title.owner).to.equal(alice.address);
    expect(title.valid).to.equal(true);
  });

  it("should allow transfer request and approval via multisig", async function () {
    // Issue title first via multisig
    const issueData = registry.interface.encodeFunctionData("issueTitle", [
      alice.address,
      "LR/KE/002",
      "ipfs://meta",
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("doc2")),
    ]);

    await multisig.connect(ownerA).submitTx(registry.address, 0, issueData);
    await multisig.connect(ownerB).confirmTx(0);

    // Alice (current owner) requests transfer to Bob
    await registry.connect(alice).requestTransfer(1, bob.address);

    // Approve transfer via multisig
    const approveData = registry.interface.encodeFunctionData("approveTransfer", [1]);
    await multisig.connect(ownerA).submitTx(registry.address, 0, approveData);
    await multisig.connect(ownerB).confirmTx(1);

    const title = await registry.titles(1);
    expect(title.owner).to.equal(bob.address);
  });

  it("should revoke a title through multisig", async function () {
    const issueData = registry.interface.encodeFunctionData("issueTitle", [
      alice.address,
      "LR/KE/003",
      "ipfs://meta",
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("doc3")),
    ]);
    await multisig.connect(ownerA).submitTx(registry.address, 0, issueData);
    await multisig.connect(ownerB).confirmTx(0);

    // Revoke title via multisig (txId increments)
    const revokeData = registry.interface.encodeFunctionData("revokeTitle", [
      1,
      "Court order",
    ]);
    await multisig.connect(ownerA).submitTx(registry.address, 0, revokeData);
    await multisig.connect(ownerB).confirmTx(1);

    const title = await registry.titles(1);
    expect(title.valid).to.equal(false);
  });
});
