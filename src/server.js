import express from "express";
import crypto from "crypto";
import { decryptRequest, encryptResponse, FlowEndpointException } from "./encryption.js";
import { getNextScreen } from "./flow.js";

const app = express();

app.use(
  express.json({
    verify: (req, res, buf, encoding) => {
      req.rawBody = buf?.toString(encoding || "utf8");
    },
  })
);

// --- YENİ: ZIRHLI ANAHTAR ÇÖZÜCÜ ---
const getPrivateKey = () => {
  const rawKey = process.env.PRIVATE_KEY;
  if (!rawKey) return null;

  // Eğer anahtar eski usül (-----BEGIN...) ise olduğu gibi döndür
  if (rawKey.trim().startsWith('-----BEGIN')) {
      return rawKey;
  }

  // Değilse, Base64 paketidir. Bunu açıp PEM formatına çevirelim.
  try {
      const decoded = Buffer.from(rawKey, 'base64').toString('utf-8');
      console.log("🔓 Private Key 'Base64 Zırhı'ndan başarıyla çıkarıldı.");
      return decoded;
  } catch (e) {
      console.error("❌ Private Key Base64 çözülemedi:", e.message);
      return null;
  }
};

const APP_SECRET = process.env.APP_SECRET;
const PORT = process.env.PORT || "3000";
const PRIVATE_KEY = getPrivateKey(); // Anahtarı güvenli şekilde al
const PASSPHRASE = process.env.PASSPHRASE || ""; // Boş olmalı

console.log("🔒 Server Başlatılıyor...");
console.log("- Private Key Yüklü mü?", !!PRIVATE_KEY);

if (PRIVATE_KEY) {
    // KONTROL: Yüklenen anahtarın parmak izini bas (Meta ile eşleşme kanıtı)
    try {
        const checkPub = crypto.createPublicKey(PRIVATE_KEY);
        const fingerprint = crypto.createHash('sha256').update(checkPub.export({type:'spki', format:'pem'})).digest('hex').substring(0, 10);
        console.log(`- Aktif Anahtar Parmak İzi: [ ${fingerprint}... ]`);
    } catch (e) {
        console.error("- ⚠️ Yüklenen Private Key bozuk görünüyor:", e.message);
    }
}

app.post("/", async (req, res) => {
  // 1. İMZA DOĞRULAMA
  if (!isRequestSignatureValid(req)) {
      return res.status(432).send();
  }

  // 2. ŞİFRE ÇÖZME VE AKIŞ
  try {
    const decryptedRequest = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
    const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
    
    // Log (Köstebek) - İstersen kapatabilirsin
    // console.log("Decrypted:", JSON.stringify(decryptedBody));

    const screenResponse = await getNextScreen(decryptedBody);
    res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
    
  } catch (err) {
    console.error("❌ Hata:", err.message);
    if (err instanceof FlowEndpointException) {
      return res.status(err.statusCode).send();
    }
    return res.status(500).send();
  }
});

app.get("/", (req, res) => res.send("WhatsApp Flows Endpoint is running!"));

function isRequestSignatureValid(req) {
  if (!APP_SECRET) return true;
  const signatureHeader = req.get("x-hub-signature-256");
  if (!signatureHeader) return false;
  const signatureBuffer = Buffer.from(signatureHeader.replace("sha256=", ""), "utf-8");
  const hmac = crypto.createHmac("sha256", APP_SECRET);
  const digestString = hmac.update(req.rawBody).digest("hex");
  const digestBuffer = Buffer.from(digestString, "utf-8");
  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));