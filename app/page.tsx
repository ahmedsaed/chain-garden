"use client";

import { useState } from "react";

// IPFS CID of the encrypted photo
const ENCRYPTED_CID = "QmctEH8TvFQSFvjmhmLUz4gVuGQbiCMKVrXEE5vUYAKt8Y";

// Decryption parameters (from encryption-meta.json)
const META = {
  salt: "pbLudzh9ym54N8lDCskQDQ==",
  iv: "NCzGvnu5MMRaOXzr",
  authTag: "JT5575b0gQt7M9WrMJKEMw==",
  iterations: 100000,
};

function base64ToBuf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function deriveKey(password: string): Promise<CryptoKey> {
  const salt = base64ToBuf(META.salt);
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: META.iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

export default function Home() {
  const [key, setKey] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function decrypt() {
    setError("");
    setLoading(true);
    setImageUrl(null);

    try {
      // Fetch encrypted blob from IPFS gateway
      const res = await fetch(
        `https://ipfs.io/ipfs/${ENCRYPTED_CID}`
      );
      if (!res.ok) throw new Error("Failed to fetch encrypted data");
      const encrypted = await res.arrayBuffer();

      // Derive key and decrypt
      const cryptoKey = await deriveKey(key);
      const iv = base64ToBuf(META.iv);
      const authTag = base64ToBuf(META.authTag);

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, additionalData: new Uint8Array(0), tagLength: 128 },
        cryptoKey,
        new Uint8Array([...new Uint8Array(encrypted), ...authTag])
      );

      // Convert to blob URL
      const blob = new Blob([decrypted], { type: "image/jpeg" });
      setImageUrl(URL.createObjectURL(blob));
    } catch {
      setError("Wrong key.");
    }
    setLoading(false);
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.title}>✦ Chain Garden</div>
        <div style={styles.subtitle}>The word blooms in darkness.</div>

        {!imageUrl && (
          <>
            <input
              type="password"
              placeholder="Enter the key…"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && decrypt()}
              style={styles.input}
            />
            <button onClick={decrypt} disabled={loading} style={styles.button}>
              {loading ? "Decrypting…" : "Unlock"}
            </button>
            {error && <div style={styles.error}>{error}</div>}
          </>
        )}

        {imageUrl && (
          <div style={styles.reveal}>
            <img src={imageUrl} alt="Decrypted moment" style={styles.img} />
            <button
              onClick={() => {
                setImageUrl(null);
                setKey("");
              }}
              style={{ ...styles.button, marginTop: 20 }}
            >
              Lock Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #050510 0%, #0a0a1a 50%, #0e0e20 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    background: "rgba(20, 20, 40, 0.4)",
    border: "1px solid rgba(200, 180, 140, 0.1)",
    borderRadius: 12,
    padding: "60px 40px",
    maxWidth: 420,
    width: "100%",
    textAlign: "center",
  },
  title: {
    fontFamily: "Georgia, serif",
    fontSize: 28,
    color: "#c8b48c",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "rgba(200,180,140,0.4)",
    marginBottom: 32,
    letterSpacing: 2,
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 6,
    border: "1px solid rgba(200,180,140,0.2)",
    background: "rgba(0,0,0,0.3)",
    color: "#e8e8f0",
    fontSize: 16,
    outline: "none",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    width: "100%",
    padding: "12px 24px",
    borderRadius: 6,
    border: "none",
    background: "linear-gradient(135deg, #c8b48c, #e8d5a0)",
    color: "#0a0a12",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 1,
  },
  error: {
    marginTop: 12,
    color: "#e67e6b",
    fontSize: 13,
    fontFamily: "monospace",
  },
  reveal: { marginTop: 0 },
  img: {
    width: "100%",
    borderRadius: 8,
    border: "1px solid rgba(200,180,140,0.15)",
  },
};
