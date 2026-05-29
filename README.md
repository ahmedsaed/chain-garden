# Chain Garden

Two ERC-721 tokens on Base. One is a proof. One is a secret.

## Tokens

| Token | Name | On-chain | Decryptable |
|-------|------|----------|-------------|
| 0 | The Symbol | ✅ SVG art + coordinates | N/A |
| 1 | The Moment | ❌ (pointer only) | ✅ AES-256-GCM |

**Encryption:** AES-256-GCM with a shared secret key.

## Prerequisites

- Node.js 18+
- MetaMask wallet with ~$5 of ETH bridged to [Base](https://bridge.base.org/)
- [Pinata](https://app.pinata.cloud/) account (free, for IPFS)

## Step-by-Step

### 1. Setup

```bash
cp .env.example .env
# Fill in: PRIVATE_KEY, RECIPIENT, PINATA_JWT
npm install
```

### 2. Test on Sepolia (recommended first)

```bash
# Set BASE_SEPOLIA_RPC in .env
npx hardhat run scripts/deploy.js --network base-sepolia
npx hardhat run scripts/mint.js --network base-sepolia
```

### 3. Encrypt the photo

```bash
# Set the shared encryption key
export ENCRYPTION_KEY=<your-key>
# Place the photo as photo.jpg in this directory
node encrypt.js
# → photo.enc (encrypted blob)
# → encryption-meta.json (salt, IV, authTag for decryption)
```

### 4. Upload to IPFS

```bash
PINATA_JWT=<your-jwt> node upload.js
# → ipfs://<metadata-cid> (save this)
```

### 5. Deploy on Base Mainnet

```bash
npx hardhat run scripts/deploy.js --network base
# → Save the contract address to .env (CONTRACT_ADDRESS)
```

### 6. Mint both tokens

```bash
npx hardhat run scripts/mint.js --network base
# → Token 0: symbolic proof (on-chain SVG)
# → Token 1: encrypted photo (IPFS pointer)
```

### 7. Verify contract (optional)

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> "Chain Garden — The Lily" "A proof that two people looked at the same sky. The word blooms in darkness."
```

## How Jana decrypts

Share `encryption-meta.json` + `photo.enc` with her. She runs:

```bash
node decrypt.js photo.enc encryption-meta.json
# Enter the shared key
# → photo-decrypted.jpg
```

## Contract

- **Chain:** Base (chainId: 8453)
- **Token standard:** ERC-721
- **Symbol:** LILY
- **Tokens:** 2 (non-transferable unless owner transfers)

## Files

| File | Purpose |
|------|---------|
| `encrypt.js` | AES-256-GCM encryption with PBKDF2 key derivation |
| `upload.js` | IPFS pinning via Pinata |
| `contracts/ChainGarden.sol` | ERC-721 with on-chain SVG metadata + IPFS tokenURI |
| `scripts/deploy.js` | Deploy contract |
| `scripts/mint.js` | Mint both tokens |
