/**
 * src/server.js
 * Geliştirilmiş sürüm: Ortam değişkeni temizliği içerir.
 */
import express from "express";
import crypto from "crypto";
import { decryptRequest, encryptResponse, FlowEndpointException } from "./encryption.js";
import { getNextScreen } from "./flow.js";

const app = express();

// İmza doğrulaması için raw body'ye ihtiyacımız var
app.use(
  express.json({
    verify: (req, res, buf, encoding) => {
      req.rawBody = buf?.toString(encoding || "utf8");
    },
  })
);

/**
 * ORTAM DEĞİŞKENİ TEMİZLEME FONKSİYONU
 * Coolify veya Docker'dan gelen tırnak işaretlerini (" veya ') ve 
 * bozuk satır sonlarını (\n) temizler.
 */
const cleanEnv = (val) => {
  if (!val) return "";
  // 1. Başındaki ve sonundaki tırnakları sil
  let cleaned = val.replace(/^['"]|['"]$/g, '');
  // 2. Literal \n karakterlerini gerçek yeni satıra çevir
  cleaned = cleaned.replace(/\\n/g, '\n');
  return cleaned;
};

// Ortam değişkenlerini al ve temizle
const APP_SECRET = cleanEnv(process.env.APP_SECRET);
const PORT = process.env.PORT || "3000";

// Private Key ve Passphrase'i temizleyerek al
const PRIVATE_KEY = cleanEnv(process.env.PRIVATE_KEY);
const PASSPHRASE = cleanEnv(process.env.PASSPHRASE) || "";

console.log("🔒 Server Başlatılıyor...");
console.log("- Private Key Durumu:", PRIVATE_KEY ? "Yüklü (Uzunluk: " + PRIVATE_KEY.length + ")" : "YOK");
console.log("- Passphrase Durumu:", PASSPHRASE ? "Yüklü" : "Yok (Boş)");

app.post("/", async (req, res) => {
  if (!PRIVATE_KEY) {
    console.error('Private key is empty. Check "PRIVATE_KEY" in .env');
    return res.status(500).send();
  }

  // 1. İMZA DOĞRULAMA (Güvenlik)
  if (!isRequestSignatureValid(req)) {
    return res.status(432).send(); // 432: Request signature mismatch
  }

  // 2. ŞİFRE ÇÖZME
  let decryptedRequest = null;
  try {
    // Şifre çözme işlemini temizlenmiş anahtarlarla yap
    decryptedRequest = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
  } catch (err) {
    console.error("❌ Şifre Çözme Hatası:", err);
    if (err instanceof FlowEndpointException) {
      return res.status(err.statusCode).send();
    }
    return res.status(500).send();
  }

  const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
  console.log("💬 Decrypted Request:", JSON.stringify(decryptedBody, null, 2));

  // 3. AKIŞ MANTIĞINI ÇALIŞTIR (flow.js)
  try {
    const screenResponse = await getNextScreen(decryptedBody);
    console.log("👉 Response to Encrypt:", JSON.stringify(screenResponse, null, 2));

    // 4. YANITI ŞİFRELE VE GÖNDER
    res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
  } catch (err) {
    console.error("❌ Akış Mantığı Hatası:", err);
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