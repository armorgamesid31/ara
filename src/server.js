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

// --- BASE64 DECODER ---
// Artık "cleanEnv" yok, "decodeEnv" var.
const getPrivateKey = () => {
  const rawKey = process.env.PRIVATE_KEY;
  if (!rawKey) return null;

  // Eğer anahtar zaten -----BEGIN ile başlıyorsa (eski usül), olduğu gibi döndür
  if (rawKey.trim().startsWith('-----BEGIN')) {
      return rawKey;
  }

  // Değilse, Base64 olduğunu varsay ve PEM formatına geri çevir
  try {
      const decoded = Buffer.from(rawKey, 'base64').toString('utf-8');
      console.log("🔓 Private Key Base64 formatından başarıyla çözüldü.");
      return decoded;
  } catch (e) {
      console.error("❌ Private Key Base64 çözülemedi:", e.message);
      return null;
  }
};

const APP_SECRET = process.env.APP_SECRET;
const PORT = process.env.PORT || "3000";
const PRIVATE_KEY = getPrivateKey(); // Yeni fonksiyonu kullan
const PASSPHRASE = process.env.PASSPHRASE || "";

console.log("🔒 Server Başlatılıyor...");
console.log("- Private Key Yüklü mü?", !!PRIVATE_KEY);
if (PRIVATE_KEY) {
    // KONTROL AMAÇLI: Yüklenen anahtarın Public parmak izini logla
    // Bu sayede Meta'ya yüklediğinle sunucudakinin aynı olduğunu kanıtlayacağız.
    try {
        const checkPub = crypto.createPublicKey(PRIVATE_KEY);
        console.log("- Serverdaki Anahtarın Parmak İzi (Hash):", 
            crypto.createHash('sha256').update(checkPub.export({type:'spki', format:'pem'})).digest('hex').substring(0, 10));
    } catch (e) {
        console.error("- ⚠️ Yüklenen Private Key bozuk görünüyor:", e.message);
    }
}

app.post("/", async (req, res) => {
  // ... (Geri kalanı aynı, köstebek logunu istersen tutabilirsin) ...
  // Buradaki decryptRequest çağrısı aynen kalacak
  
  // 1. İMZA DOĞRULAMA
  if (!isRequestSignatureValid(req)) {
      return res.status(432).send();
  }

  // 2. ŞİFRE ÇÖZME
  try {
    const decryptedRequest = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
    const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
    
    const screenResponse = await getNextScreen(decryptedBody);
    res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
    
  } catch (err) {
    console.error("❌ İşlem Hatası:", err.message);
    if (err instanceof FlowEndpointException) {
      return res.status(err.statusCode).send();
    }
    return res.status(500).send();
  }
});

// ... (Geri kalan fonksiyonlar aynı) ...
// isRequestSignatureValid fonksiyonunu eklemeyi unutma
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