const hre = require('hardhat');

async function main() {
  const ethers = hre.ethers;
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const ownerA = signers[1];
  const ownerB = signers[2];
  const ownerC = signers[3];

  const ownersEnv = process.env.MULTISIG_OWNERS ? process.env.MULTISIG_OWNERS.split(",") : [ownerA.address, ownerB.address, ownerC.address];
  const threshold = process.env.MULTISIG_THRESHOLD ? parseInt(process.env.MULTISIG_THRESHOLD) : 2;

  const MultiSig = await ethers.getContractFactory("SimpleMultiSig");
  const multisig = await MultiSig.deploy(ownersEnv, threshold);
  await multisig.deployed();
  console.log("SimpleMultiSig deployed to:", multisig.address);

  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistry.deploy(multisig.address);
  await registry.deployed();
  console.log("LandRegistry deployed to:", registry.address);
  console.log("Multisig owners:", ownersEnv);
  console.log("Threshold:", threshold);
  console.log("Deployed by:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
