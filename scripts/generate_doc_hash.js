const fs = require('fs');
const { ethers } = require('ethers');

const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: node scripts/generate_doc_hash.js <file>');
  process.exit(1);
}
const data = fs.readFileSync(filePath);
const hash = ethers.utils.keccak256(data);
console.log(hash);
