#!/usr/bin/env node
// Upload encrypted photo + metadata to IPFS via Pinata
const fs = require('fs');
const path = require('path');

const PINATA_JWT = process.env.PINATA_JWT;
const ENCRYPTED_FILE = path.resolve(__dirname, 'photo.enc');

if (!PINATA_JWT) {
  console.error('❌ Set PINATA_JWT environment variable.\n   Get one at https://app.pinata.cloud/developers/api-keys');
  process.exit(1);
}
if (!fs.existsSync(ENCRYPTED_FILE)) {
  console.error('❌ photo.enc not found. Run encrypt.js first.');
  process.exit(1);
}

async function uploadToIPFS(filePath, name) {
  const formData = new FormData();
  formData.append('file', new Blob([fs.readFileSync(filePath)]), name);
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));
  
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata upload failed: ${res.status} ${err}`);
  }
  
  return await res.json();
}

async function uploadJSON(json) {
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(json),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata JSON upload failed: ${res.status} ${err}`);
  }
  
  return await res.json();
}

async function main() {
  console.log('📤 Uploading encrypted photo to IPFS...');
  const fileResult = await uploadToIPFS(ENCRYPTED_FILE, 'photo.enc');
  const encCid = fileResult.IpfsHash;
  console.log(`✅ Encrypted photo: ipfs://${encCid}`);
  
  // Create token metadata pointing to encrypted photo
  const metadata = {
    name: 'Chain Garden — The Moment',
    description: 'An encrypted moment. Only the holder of the key can see it. The word blooms in darkness.',
    image: `ipfs://${encCid}`,
    external_url: '',
    attributes: [
      { trait_type: 'Series', value: 'Chain Garden' },
      { trait_type: 'Token', value: 'The Moment' },
      { trait_type: 'Encrypted', value: 'AES-256-GCM' },
    ],
  };
  
  console.log('📤 Uploading metadata JSON to IPFS...');
  const metaResult = await uploadJSON(metadata);
  const metaCid = metaResult.IpfsHash;
  console.log(`✅ Metadata: ipfs://${metaCid}`);
  
  // Save for deployment
  const out = {
    encryptedCid: encCid,
    metadataCid: metaCid,
    tokenURI: `ipfs://${metaCid}`,
  };
  fs.writeFileSync(path.resolve(__dirname, 'ipfs-output.json'), JSON.stringify(out, null, 2));
  console.log('\n📋 Saved to ipfs-output.json');
  console.log(JSON.stringify(out, null, 2));
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
