import express from "express";
import crypto from "crypto";
import { getNextScreen } from "./flow.js";

const app = express();
const PORT = process.env.PORT || "3000";
const APP_SECRET = process.env.APP_SECRET; // İmza doğrulaması için

// --- GLOBAL ANAHTAR YÖNETİMİ (SUNUCU İÇİNDE) ---
// Private Key dışarıdan alınmayacak, burada üretilecek.
console.log("🏭 SUNUCU BAŞLATILIYOR: Taze anahtar çifti üretiliyor...");

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Public Key'i Temizle (Meta için)
const cleanPublicKey = publicKey
  .replace('-----BEGIN PUBLIC KEY-----', '')
  .replace('-----END PUBLIC KEY-----', '')
  .replace(/[\r\n\s]/g, '');

console.log("\n👇 ======================================================= 👇");
console.log("🔑 META GÜNCELLEME KOMUTU (Bunu Kopyala ve Terminalde Çalıştır):");
console.log("---------------------------------------------------------------");
console.log(`
const https = require('https');
const data = JSON.stringify({
  endpoint_uri: "https://flows.berkai.shop",
  application_public_key: "${cleanPublicKey}"
});
const options = {
  hostname: 'graph.facebook.com',
  path: '/v21.0/25314368698232998', // Senin Flow ID
  method: 'POST',
  headers: {
    'Authorization': 'Bearer EAAPZBrqVoIMwBQYZCxZCnKlrEzuCFDnF625X05iSBE5g2FPZCq0IGTTCtcw7bc3HL57KsjHXZAZCf4bekRVSXXJhkgqEVR8iU5dwtTlANK7bVZAZAtsg9ZBLQ1DI2YhlXUjwb8DugL3G2erpu1cNJcgdhymfvt9OY8RZBXiFugrZBZBsZBJTocRVWStF0n9EYDa9WOZBa26wta4UVSBSZCYwWxMCt4y3zZB2gGviDhhKuvSqSjXSZAPSuspbJkGDIsdhEtbFRYmw6stZCMxMjptYK6QJOHDlIRs7hu46VRTW8YsqHdUjgZD',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = https.request(options, res => {
  res.on('data', d => process.stdout.write(d));
});
req.write(data);
req.end();
`);
console.log("---------------------------------------------------------------");
console.log("☝️  Sunucu her yeniden başladığında bu anahtar değişir! Hızlıca güncellemelisin. ☝️");
console.log("👆 ======================================================= 👆\n");

// --- MIDDLEWARE ---
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf?.toString(encoding || "utf8");
  },
}));

// --- ŞİFRE ÇÖZME VE YANITLAMA (Her şey burada) ---
app.post("/", async (req, res) => {
  // 1. İmza Doğrulama
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

    // 2. AES Anahtarını Çöz (Generated Private Key ile)
    // NOT: mgf1Hash eklemiyoruz çünkü Node varsayılanı (SHA1) genellikle Meta ile uyumludur
    // Eğer yine hata alırsak buraya { oaepHash: 'sha256' } ekleyebiliriz.
    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
      },
      Buffer.from(encrypted_aes_key, "base64")
    );

    // 3. Veriyi Çöz (AES-GCM)
    const flowDataBuffer = Buffer.from(encrypted_flow_data, "base64");
    const ivBuffer = Buffer.from(initial_vector, "base64");
    const authTag = flowDataBuffer.subarray(-16);
    const encBody = flowDataBuffer.subarray(0, -16);

    const decipher = crypto.createDecipheriv("aes-128-gcm", decryptedAesKey, ivBuffer);
    decipher.setAuthTag(authTag);
    const decryptedJSON = Buffer.concat([decipher.update(encBody), decipher.final()]).toString("utf-8");
    const decryptedBody = JSON.parse(decryptedJSON);

    // 4. Akış Mantığı
    const responseData = await getNextScreen(decryptedBody);

    // 5. Yanıtı Şifrele
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
    // console.error(error); // Detay istersen aç
    res.status(500).send();
  }
});

app.get("/", (req, res) => res.send("Active"));
app.listen(PORT, () => console.log(`Server running on ${PORT}`));