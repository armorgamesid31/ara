/**
 * src/server.js
 * DEBUG MODU: Hem ortam değişkenlerini temizler hem de gelen şifreli veriyi loglar.
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

// --- ORTAM DEĞİŞKENİ TEMİZLEYİCİ ---
const cleanEnv = (val) => {
  if (!val) return "";
  // Tırnakları ve bozuk satır sonlarını temizle
  let cleaned = val.replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n');
  return cleaned;
};

const APP_SECRET = cleanEnv(process.env.APP_SECRET);
const PORT = process.env.PORT || "3000";
const PRIVATE_KEY = cleanEnv(process.env.PRIVATE_KEY);
const PASSPHRASE = cleanEnv(process.env.PASSPHRASE) || "";

console.log("🔒 Server Başlatılıyor (DEBUG MOD)...");
console.log("- Private Key Yüklü mü?", !!PRIVATE_KEY);

app.post("/", async (req, res) => {
  // 1. ÖNCE GELEN VERİYİ LOGLA (Hata olsa bile bunu göreceğiz)
  console.log("\n📦 [DEBUG] META'DAN GELEN İSTEK:");
  console.log("--------------------------------------------------");
  if (req.body.encrypted_aes_key) {
      console.log("🔑 Encrypted AES Key (BUNU KOPYALA):");
      console.log(req.body.encrypted_aes_key);
  } else {
      console.log("⚠️ encrypted_aes_key bulunamadı! Body:", JSON.stringify(req.body).substring(0, 100));
  }
  console.log("--------------------------------------------------\n");

  if (!PRIVATE_KEY) {
    console.error('Private key is empty.');
    return res.status(500).send();
  }

  // 2. İMZA DOĞRULAMA
  if (!isRequestSignatureValid(req)) {
    return res.status(432).send();
  }

  // 3. ŞİFRE ÇÖZME
  let decryptedRequest = null;
  try {
    decryptedRequest = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
  } catch (err) {
    console.error("❌ Şifre Çözme Hatası (Normal, logu aldık):", err.message);
    if (err instanceof FlowEndpointException) {
      return res.status(err.statusCode).send();
    }
    return res.status(500).send();
  }

  // ... Kodun geri kalanı ...
  try {
    const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
    const screenResponse = await getNextScreen(decryptedBody);
    res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

app.get("/", (req, res) => res.send("WhatsApp Flows Endpoint is running!"));
app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`));

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