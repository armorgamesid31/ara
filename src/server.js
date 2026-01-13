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

// --- GELİŞMİŞ ORTAM DEĞİŞKENİ TEMİZLEYİCİ ---
const cleanEnv = (val) => {
  if (!val) return "";
  // 1. Önce varsa başındaki ve sonundaki tırnakları sil (' veya ")
  let cleaned = val.replace(/^['"]|['"]$/g, '');
  
  // 2. "\n" (literal) karakterlerini gerçek satır sonuna çevir
  cleaned = cleaned.replace(/\\n/g, '\n');
  
  return cleaned;
};

// Değişkenleri güvenli bir şekilde al
const APP_SECRET = cleanEnv(process.env.APP_SECRET);
const PORT = process.env.PORT || "3000";

// Private Key ve Passphrase'i temizleyerek al
const PRIVATE_KEY = cleanEnv(process.env.PRIVATE_KEY);
const PASSPHRASE = cleanEnv(process.env.PASSPHRASE) || "";

console.log("🔒 Anahtar Kontrolü:");
console.log("- Private Key yüklendi mi?", !!PRIVATE_KEY);
console.log("- Passphrase yüklendi mi?", !!PASSPHRASE ? "(Evet)" : "(Hayır)");
// ---------------------------------------------

app.post("/", async (req, res) => {
  // 1. Gelen isteğin içeriğini yakala
  const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;
  
  console.log("\n📦 [KÖSTEBEK] META'DAN GELEN PAKET:");
  console.log("--------------------------------------------------");
  console.log("🔑 Encrypted AES Key (Bunu kopyala):");
  console.log(encrypted_aes_key); // <-- İŞTE BU ÇOK ÖNEMLİ
  console.log("--------------------------------------------------\n");

  try {
    // Mevcut çözme işlemini dene
    const decryptedRequest = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
    
    // ... (Kodun geri kalanı aynı) ...
    const { action, screen, data } = decryptedRequest;
    // ...
    
  } catch (error) {
    console.error("❌ Şifre Çözme Hatası (Normal, panik yapma)");
    console.error(error.message);
    
    // Meta'ya 421 dönüyoruz ki tekrar denesin, ama biz logu aldık bile.
    return res.status(421).send();
  }
});

  // 3. AKIŞ MANTIĞINI ÇALIŞTIR (flow.js)
  try {
    const screenResponse = await getNextScreen(decryptedBody);
    console.log("👉 Response to Encrypt:", JSON.stringify(screenResponse, null, 2));

    // 4. YANITI ŞİFRELE VE GÖNDER
    res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

app.get("/", (req, res) => {
  res.send("WhatsApp Flows Endpoint is running! 🚀");
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});

// İmza Doğrulama Fonksiyonu
function isRequestSignatureValid(req) {
  if (!APP_SECRET) {
    console.warn("App Secret is not set up. Verification skipped (NOT RECOMMENDED).");
    return true;
  }

  const signatureHeader = req.get("x-hub-signature-256");
  if (!signatureHeader) {
    console.error("Error: x-hub-signature-256 header is missing");
    return false;
  }

  const signatureBuffer = Buffer.from(signatureHeader.replace("sha256=", ""), "utf-8");
  const hmac = crypto.createHmac("sha256", APP_SECRET);
  const digestString = hmac.update(req.rawBody).digest("hex");
  const digestBuffer = Buffer.from(digestString, "utf-8");

  if (!crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
    console.error("Error: Request Signature did not match");
    return false;
  }
  return true;
}