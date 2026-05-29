#!/usr/bin/env node
// Decrypt photo.enc using the shared key
const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

const ENCRYPTED = process.argv[2];
const META = process.argv[3];

if (!ENCRYPTED || !META) {
  console.log('Usage: node decrypt.js <photo.enc> <encryption-meta.json>');
  console.log('You will be prompted for the key.');
  process.exit(1);
}

const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
const encrypted = fs.readFileSync(ENCRYPTED);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('🔑 Enter key: ', (secret) => {
  rl.close();

  try {
    const salt = Buffer.from(meta.salt, 'base64');
    const iv = Buffer.from(meta.iv, 'base64');
    const authTag = Buffer.from(meta.authTag, 'base64');

    const key = crypto.pbkdf2Sync(secret, salt, meta.iterations, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const outPath = ENCRYPTED.replace('.enc', '-decrypted.jpg');
    fs.writeFileSync(outPath, decrypted);
    console.log(`✅ Decrypted → ${outPath}`);
  } catch (e) {
    console.log('❌ Wrong key or corrupted file.');
  }
});
