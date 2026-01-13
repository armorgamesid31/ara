/**
 * src/server.js
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

// Ortam değişkenlerini al
const { APP_SECRET, PRIVATE_KEY, PASSPHRASE = "", PORT = "3000" } = process.env;

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
    decryptedRequest = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
  } catch (err) {
    console.error(err);
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