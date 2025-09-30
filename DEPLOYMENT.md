# DEPLOYMENT GUIDE — DeTrust Land (Step-by-step)

This guide walks through local testing and testnet deployment using Hardhat.

## Prerequisites
- Node.js v18+
- npm
- MetaMask (for testnet interactions)
- Sepolia testnet ETH or Polygon Amoy MATIC (faucet)

## 1) Install deps
```bash
git clone <this-repo>
cd landregistry_project
npm install
```

## 2) Compile
```bash
npx hardhat compile
```

## 3) Run tests (local)
Start a local Hardhat node (terminal A):
```bash
npx hardhat node
```
In another terminal (B) run:
```bash
npx hardhat run scripts/deploy.js --network localhost
npx hardhat test
```

## 4) Deploy to Sepolia (or another public testnet)
Set environment variables (Linux/macOS):
```bash
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
export DEPLOYER_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"  # the deployment account
export MULTISIG_OWNERS="0xADDR1,0xADDR2,0xADDR3"  # optional - register multisig owners
export MULTISIG_THRESHOLD=2  # optional
```

Then:
```bash
npm run deploy:sepolia
```

The deploy script will:
- Deploy `SimpleMultiSig` with the owners provided (or fallback to local signer addresses).
- Deploy `LandRegistry` with the multisig contract address set as `registrar`.
- Print deployed contract addresses.

## 5) Connect to Multibaas
- In Multibaas dashboard, create a new project and add your network.
- Add `LandRegistry` contract address and import ABI from `artifacts/contracts/LandRegistry.sol/LandRegistry.json`.
- Configure roles (Registrar, Owner) and test endpoints: `issueTitle`, `requestTransfer`, `approveTransfer`, `verifyParcelOwner`.

## 6) Generate document hash
Use:
```bash
node scripts/generate_doc_hash.js path/to/title.pdf
```
Copy the returned hex and use it as `docHash` when calling `issueTitle`.

## Tips
- For real demos, fund the owners' addresses with testnet ETH.
- Use MultiSig owner accounts you control (add them to MetaMask).
- For production consider using an audited multisig (Gnosis Safe) instead of `SimpleMultiSig`.
