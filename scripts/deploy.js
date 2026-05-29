// Deploy ChainGarden contract to Base
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deploying from: ${deployer.address}`);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  const ChainGarden = await hre.ethers.getContractFactory("ChainGarden");
  const contract = await ChainGarden.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ Contract deployed to: ${address}`);
  console.log(`   BaseScan: https://basescan.org/address/${address}`);
}

main().catch(e => { console.error(e); process.exit(1); });
