// Mint two tokens: Symbol (on-chain) + Photo (IPFS + on-chain)
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RECIPIENT = process.env.RECIPIENT;

async function main() {
  if (!CONTRACT_ADDRESS || !RECIPIENT) {
    console.error("❌ Set CONTRACT_ADDRESS and RECIPIENT in .env");
    process.exit(1);
  }

  const [signer] = await hre.ethers.getSigners();
  console.log(`Signer: ${signer.address}`);
  console.log(`Recipient: ${RECIPIENT}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}\n`);

  const ChainGarden = await hre.ethers.getContractAt("ChainGarden", CONTRACT_ADDRESS, signer);

  // --- Token 0: The Symbol (on-chain only, no IPFS) ---
  {
    const name = "Chain Garden — The Lily";
    const desc = "A proof that two people looked at the same sky. The word blooms in darkness.";
    const uri = "";

    console.log("🌱 Minting Token 0 — The Symbol (on-chain only)...");
    const tx = await ChainGarden.mint(RECIPIENT, name, desc, uri);
    const receipt = await tx.wait();
    console.log(`✅ Minted — tx: ${tx.hash}`);
    console.log(`   BaseScan: https://basescan.org/tx/${tx.hash}\n`);
  }

  // --- Token 1: The Moment (on-chain name + IPFS photo) ---
  {
    const ipfsPath = path.resolve(__dirname, '..', 'ipfs-output.json');
    let ipfsURI = "";
    if (fs.existsSync(ipfsPath)) {
      const ipfsData = JSON.parse(fs.readFileSync(ipfsPath, 'utf8'));
      ipfsURI = ipfsData.tokenURI;
    }
    if (!ipfsURI) {
      console.error("❌ No ipfs-output.json found. Run upload.js first.");
      process.exit(1);
    }

    const name = "Chain Garden — The Moment";
    const desc = "An encrypted moment. Only the holder of the key can see it. The word blooms in darkness. Key: the one flower that grows in darkness.";

    console.log("📸 Minting Token 1 — The Moment (on-chain + IPFS)...");
    console.log(`   URI: ${ipfsURI}`);
    const tx = await ChainGarden.mint(RECIPIENT, name, desc, ipfsURI);
    const receipt = await tx.wait();
    console.log(`✅ Minted — tx: ${tx.hash}`);
    console.log(`   BaseScan: https://basescan.org/tx/${tx.hash}\n`);
  }

  const total = await ChainGarden.totalMinted();
  console.log(`🎉 Done! Total minted: ${total.toString()}`);
  console.log(`   Owner: ${RECIPIENT}`);
  console.log(`   Contract: https://basescan.org/address/${CONTRACT_ADDRESS}`);
}

main().catch(e => { console.error(e); process.exit(1); });
