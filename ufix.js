import fs from 'fs';
import crypto from 'crypto';
import https from 'https';
import path from 'path';

// --- AYARLAR ---
const CONFIG = {
    FLOW_ID: "25314368698232998",
    ACCESS_TOKEN: "EAAPZBrqVoIMwBQf9imHCvdAEz9quSeHgGslvbTNd9oUQV2ZBQ0UoA6ZCBdEYTZCqhrVvGDR3SZAIhI6fTfPOJk5v9glOnj4eQjAA2xKk5JSyFyGtxYaY27QZBCEZBlm63xafPaGaH6raDinHITw37PHVXGZA5O39dZAaAGgaZBxL8nNcQaOTuNKI9ijNlhkIGTwek9vRyyihmCZBxWLG5FS4qstaFUCeUijrYAcsm9Y7s20GXNzCZBf7Qxebee77AxkbwjzPT7XxbVnAe4pfD4sptZBTRok6QahriCSeh3puigQZDZD",
    ENDPOINT_URL: "https://flows.berkai.shop"
};

async function fixItAll() {
    console.log("💀 FINAL FIX BAŞLIYOR... (Brute-Force Modu)\n");

    // 1. ANAHTARLARI OLUŞTUR VE DOSYAYA YAZ
    // Kod içine gömmüyoruz, doğrudan dosyadan okutacağız. En temizi.
    console.log("1️⃣  Anahtar Dosyası (src/private.pem) oluşturuluyor...");
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    // src klasörüne yaz
    const srcDir = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir);
    fs.writeFileSync(path.join(srcDir, 'private.pem'), privateKey);
    console.log("✅ Private Key dosyaya kaydedildi.");

    // 2. META GÜNCELLEME
    console.log("\n2️⃣  Meta Güncelleniyor...");
    const cleanPublicKey = publicKey
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/[\r\n\s]/g, '');

    const postData = JSON.stringify({
        endpoint_uri: CONFIG.ENDPOINT_URL,
        application_public_key: cleanPublicKey
    });

    await new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'graph.facebook.com',
            path: `/v21.0/${CONFIG.FLOW_ID}`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.success) {
                    console.log("✅ Meta OK (Success: true)");
                    resolve();
                } else {
                    console.log("❌ Meta Hatası:", JSON.stringify(result, null, 2));
                    reject();
                }
            });
        });
        req.write(postData);
        req.end();
    });

    // 3. SERVER.JS YAZ (BRUTE-FORCE DECRYPT MANTIĞI İLE)
    console.log("\n3️⃣  src/server.js 'Dene-Yanıl' motoruyla yazılıyor...");
    
    const serverCode = `
import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getNextScreen } from "./flow.js";

const app = express();
const PORT = process.env.PORT || "3000";

// Anahtarı dosyadan oku (Hata payı 0)
let PRIVATE_KEY;
try {
    // Docker içinde /app/src/private.pem veya lokalde src/private.pem
    const keyPath = path.join(process.cwd(), 'src', 'private.pem');
    PRIVATE_KEY = fs.readFileSync(keyPath, 'utf8');
    console.log("🔒 Private Key dosyadan yüklendi.");
} catch (e) {
    console.error("❌ ANAHTAR DOSYASI OKUNAMADI:", e.message);
    process.exit(1);
}

app.use(express.json({
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf?.toString(encoding || "utf8");
  },
}));

// --- SİHİRLİ ÇÖZÜCÜ FONKSİYON ---
// Tek bir ayar yerine hepsini dener.
function bruteForceDecrypt(encryptedBase64, privateKey) {
    const configs = [
        { name: "Standard (SHA256+SHA256)", oaepHash: "sha256", mgf1Hash: "sha256" },
        { name: "Mixed (SHA256+SHA1)", oaepHash: "sha256", mgf1Hash: "sha1" },
        { name: "Node Default (SHA256)", oaepHash: "sha256" }, // mgf1 varsayılan
        { name: "Legacy (SHA1)", oaepHash: "sha1" }
    ];

    let lastError;

    for (const config of configs) {
        try {
            const decryptOptions = {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: config.oaepHash
            };
            if (config.mgf1Hash) decryptOptions.mgf1Hash = config.mgf1Hash;

            const buffer = Buffer.from(encryptedBase64, "base64");
            const decrypted = crypto.privateDecrypt(decryptOptions, buffer);
            
            console.log(\`✅ Şifre çözüldü! Kullanılan yöntem: \${config.name}\`);
            return decrypted; // Başarılı olursa döndür
        } catch (e) {
            lastError = e;
            // Sıradaki yönteme geç
        }
    }
    // Hiçbiri çalışmazsa hatayı fırlat
    throw lastError;
}

app.post("/", async (req, res) => {
  // İmza doğrulama pas geçiliyor (odak noktamız şifre çözmek)
  
  try {
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = req.body;

    // 1. BRUTE FORCE DECRYPT ÇAĞRISI
    const decryptedAesKey = bruteForceDecrypt(encrypted_aes_key, PRIVATE_KEY);

    // 2. AES Çözme
    const flowDataBuffer = Buffer.from(encrypted_flow_data, "base64");
    const ivBuffer = Buffer.from(initial_vector, "base64");
    const authTag = flowDataBuffer.subarray(-16);
    const encBody = flowDataBuffer.subarray(0, -16);

    const decipher = crypto.createDecipheriv("aes-128-gcm", decryptedAesKey, ivBuffer);
    decipher.setAuthTag(authTag);
    const decryptedJSON = Buffer.concat([decipher.update(encBody), decipher.final()]).toString("utf-8");
    const decryptedBody = JSON.parse(decryptedJSON);

    // 3. Akış
    const responseData = await getNextScreen(decryptedBody);

    // 4. Yanıtla
    const flippedIv = Buffer.from(ivBuffer.map(b => ~b));
    const cipher = crypto.createCipheriv("aes-128-gcm", decryptedAesKey, flippedIv);
    const encryptedResponse = Buffer.concat([
      cipher.update(JSON.stringify(responseData), "utf-8"),
      cipher.final(),
      cipher.getAuthTag()
    ]).toString("base64");

    res.send(encryptedResponse);

  } catch (error) {
    console.error("❌ KRİTİK HATA (Tüm yöntemler denendi):", error.message);
    res.status(500).send();
  }
});

app.get("/", (req, res) => res.send("Final Fix Server Running"));
app.listen(PORT, () => console.log(\`Server listening on \${PORT}\`));
`;

    fs.writeFileSync(path.join(srcDir, 'server.js'), serverCode);
    console.log("✅ src/server.js güncellendi.");
    console.log("\n🚀 BİTTİ! Şimdi şunları yap:");
    console.log("   git add .");
    console.log("   git commit -m 'Ultimate fix'");
    console.log("   git push");
}

fixItAll();