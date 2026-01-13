import fs from 'fs';
import crypto from 'crypto';
import https from 'https';
import path from 'path';

// --- AYARLAR ---
const CONFIG = {
    FLOW_ID: "25314368698232998", // Senin Flow ID
    ACCESS_TOKEN: "EAAPZBrqVoIMwBQf9imHCvdAEz9quSeHgGslvbTNd9oUQV2ZBQ0UoA6ZCBdEYTZCqhrVvGDR3SZAIhI6fTfPOJk5v9glOnj4eQjAA2xKk5JSyFyGtxYaY27QZBCEZBlm63xafPaGaH6raDinHITw37PHVXGZA5O39dZAaAGgaZBxL8nNcQaOTuNKI9ijNlhkIGTwek9vRyyihmCZBxWLG5FS4qstaFUCeUijrYAcsm9Y7s20GXNzCZBf7Qxebee77AxkbwjzPT7XxbVnAe4pfD4sptZBTRok6QahriCSeh3puigQZDZD",
    ENDPOINT_URL: "https://flows.berkai.shop"
};

async function fixEverything() {
    console.log("🛠️  PROJE ONARIMI BAŞLIYOR...\n");

    // 1. YENİ VE SABİT BİR ANAHTAR ÇİFTİ ÜRET
    console.log("1️⃣  Yeni RSA Anahtar Çifti Üretiliyor (PKCS8 - 2048 bit)...");
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    console.log("✅ Anahtarlar üretildi.");

    // 2. META'YI GÜNCELLE
    console.log("\n2️⃣  Public Key Meta'ya Yükleniyor...");
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
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.success) {
                    console.log("✅ Meta Güncellemesi BAŞARILI!");
                    resolve();
                } else {
                    console.error("❌ Meta Güncelleme Hatası:", JSON.stringify(result, null, 2));
                    reject(new Error("Meta update failed"));
                }
            });
        });
        req.write(postData);
        req.end();
    });

    // 3. SERVER.JS DOSYASINI YENİDEN YAZ (Anahtar Gömülü + MGF1 Fix)
    console.log("\n3️⃣  src/server.js Dosyası Yeniden Yazılıyor...");
    
    // Private key'i JS string'i içine güvenli şekilde gömmek için düzenle
    const safePrivateKey = privateKey.replace(/\n/g, '\\n');

    const serverContent = `
import express from "express";
import crypto from "crypto";
import { getNextScreen } from "./flow.js";

const app = express();
const PORT = process.env.PORT || "3000";
const APP_SECRET = process.env.APP_SECRET;

// 🔒 SABİT PRIVATE KEY (Otomatik Gömüldü)
const PRIVATE_KEY = \`${privateKey}\`;

app.use(express.json({
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf?.toString(encoding || "utf8");
  },
}));

app.post("/", async (req, res) => {
  // İmza Doğrulama
  if (APP_SECRET) {
    const signature = req.get("x-hub-signature-256");
    if (!signature) return res.status(432).send();
    const hmac = crypto.createHmac("sha256", APP_SECRET);
    const digest = Buffer.from("sha256=" + hmac.update(req.rawBody).digest("hex"), "utf-8");
    const sigBuf = Buffer.from(signature, "utf-8");
    if (digest.length !== sigBuf.length || !crypto.timingSafeEqual(digest, sigBuf)) {
      return res.status(432).send();
    }
  }

  try {
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = req.body;

    // 🔓 ŞİFRE ÇÖZME (MGF1 FIX DAHİL)
    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: PRIVATE_KEY,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
        mgf1Hash: "sha256" // <--- İŞTE EKSİK OLAN PARÇA! Meta bunu istiyor.
      },
      Buffer.from(encrypted_aes_key, "base64")
    );

    // AES-GCM Çözme
    const flowDataBuffer = Buffer.from(encrypted_flow_data, "base64");
    const ivBuffer = Buffer.from(initial_vector, "base64");
    const authTag = flowDataBuffer.subarray(-16);
    const encBody = flowDataBuffer.subarray(0, -16);

    const decipher = crypto.createDecipheriv("aes-128-gcm", decryptedAesKey, ivBuffer);
    decipher.setAuthTag(authTag);
    const decryptedJSON = Buffer.concat([decipher.update(encBody), decipher.final()]).toString("utf-8");
    const decryptedBody = JSON.parse(decryptedJSON);

    // Akış Mantığı
    const responseData = await getNextScreen(decryptedBody);

    // Yanıt Şifreleme
    const flippedIv = Buffer.from(ivBuffer.map(b => ~b));
    const cipher = crypto.createCipheriv("aes-128-gcm", decryptedAesKey, flippedIv);
    const encryptedResponse = Buffer.concat([
      cipher.update(JSON.stringify(responseData), "utf-8"),
      cipher.final(),
      cipher.getAuthTag()
    ]).toString("base64");

    res.send(encryptedResponse);

  } catch (error) {
    console.error("❌ HATA:", error.message);
    // Hata durumunda 421 dönerek Meta'nın anahtarı yenilemesini zorlayalım
    res.status(421).send();
  }
});

app.get("/", (req, res) => res.send("Active"));
app.listen(PORT, () => console.log(\`Server running on \${PORT}\`));
`;

    // Dosyayı kaydet
    const serverPath = path.join(process.cwd(), 'src', 'server.js');
    fs.writeFileSync(serverPath, serverContent);
    console.log(`✅ Dosya güncellendi: ${serverPath}`);

    console.log("\n🎉 İŞLEM TAMAMLANDI!");
    console.log("👉 Şimdi yapman gereken tek şey:");
    console.log("   git add .");
    console.log("   git commit -m 'Fix key and algos'");
    console.log("   git push");
    console.log("👉 Coolify deploy edince test et. Artık anahtar değişmeyecek.");
}

fixEverything().catch(console.error);