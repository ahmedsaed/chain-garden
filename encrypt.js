#!/usr/bin/env node
// Encrypt photo with AES-256-GCM, key derived from a shared secret
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECRET = process.env.ENCRYPTION_KEY;
if (!SECRET) {
  console.error('❌ Set ENCRYPTION_KEY environment variable.');
  process.exit(1);
}
const INPUT = path.resolve(__dirname, 'photo.jpg');
const OUTPUT = path.resolve(__dirname, 'photo.enc');
const META_OUT = path.resolve(__dirname, 'encryption-meta.json');

if (!fs.existsSync(INPUT)) {
  console.error('❌ photo.jpg not found. Place the photo in this directory.');
  process.exit(1);
}

// Derive a 256-bit key from the secret word
const salt = crypto.randomBytes(16);
const key = crypto.pbkdf2Sync(SECRET, salt, 100000, 32, 'sha256');

// Encrypt
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const plaintext = fs.readFileSync(INPUT);
const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const authTag = cipher.getAuthTag();

// Write encrypted blob
fs.writeFileSync(OUTPUT, encrypted);
console.log(`✅ Encrypted photo → ${OUTPUT} (${(encrypted.length / 1024).toFixed(1)} KB)`);

// Write metadata needed for decryption (salt + IV + auth tag — NOT the key)
const meta = {
  algorithm: 'aes-256-gcm',
  kdf: 'pbkdf2-sha256',
  iterations: 100000,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  authTag: authTag.toString('base64'),
  hint: 'The word is the one that blooms in darkness.',
};
fs.writeFileSync(META_OUT, JSON.stringify(meta, null, 2));
console.log(`✅ Decryption metadata → ${META_OUT}`);
console.log('\n📋 Decryption metadata (store/share this with Jana):');
console.log(JSON.stringify(meta, null, 2));
console.log('📂 Encrypted: photo.enc — upload this to IPFS');
