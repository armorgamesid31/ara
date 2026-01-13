
import express from "express";
import crypto from "crypto";
import { getNextScreen } from "./flow.js";

const app = express();
const PORT = process.env.PORT || "3000";
const APP_SECRET = process.env.APP_SECRET;

// 🔒 SABİT PRIVATE KEY (Otomatik Gömüldü)
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCYcebP2sUpdzMv
yAglgKl9zucaPfAO8vrUTnxXshNwePOqdJvuOG7WxZEEKQNxzSdoFk0W6CKlUXNI
4hVqM2Vn1LuZ3a/kzrCe5+YCB0vmXGEf8K+NYUzIWT0HKzRMbBGk4dqNYMGOqKa2
jAJ3taZAOiXP+A90sp92rZoRdkLiduTIevFH1cMeu6YDUs6DN/5K2zERcQsRpI8B
vr3eDq90kPiAjQNRqwjpKrlrokLkGieAWnOeF52kY6/wR1emiay9fh2kUPCh2Pe3
GYSIA8KbRiPfg3Gg6bpOswENffdbTZCfdn4b4viF5PDPhU/9jDVZh0TxcE9jlZGi
unxPm/cRAgMBAAECggEAAT6hfuN0oNAgFcez51MmWchcGIRWcYIi3E5laKrjypM2
PBdLzvVc1E8/I0dOx6RVlMg6f2bMTPNotfjglLd64GQ7LDhZj2GaTWXWedWY6qEo
9YONJLdIEvUFkPQq7w/NJ2k6VAACUeRHHi5E9o4VX34KC9QPk5Psxjbdzz7bBhx6
q020/HnyPPLuc48vEcs56Px+PdkrigHWXo2NPR+3EJSxis07BKA79AayV3iyvr4G
6A+5wu7DbJATul06/I4ETeIafUYt0oUL+fI2VgqhNDi4r08qTkoUWEsUuP1OZ/T+
VviHziT3W4C20WDKT7/ZZ0PUIVKgBFoqhqT5t9IOMQKBgQDL9hPTGGeQCDL2X/UR
EECpyBkSIEWrARWSkIj520KvTJsCFvTnVzRpYNUuCohG44yGgWKBrwc2JBxnVRsG
tKbjTD9yscoJL7+9MZft4V8pS0X8G0aXdDIw8wYgqA1Euy3+jaXc6yD3iDM4WZTM
2lM5ame0pxkPoXX0iQMqugTl+QKBgQC/Vvy6WEnvhSExiU6HMqKhURZ0au6rIh7G
CI0jkrTyGaTPTZha4YESJshFfOk9iSJt4Zn6eEgripBsjm9T9UXt5AhOqz11ccMx
WuAkiyZLo4W41fizXSIVHt7TNKqZEB+/YMc1QrqB8Vck0iUg67o/I4Ue6OXl3ToG
hoS18/L/2QKBgCath5zkZ988bs2h7MtLlbecpoR1ckC3d+vPVOps1fyAPnTq/Y5R
TzMcldChVq56wE9Rgeit1GRD/M7rqLBg2bUI5I9Pf8y2LVonaXRG5NDj4WWpln1q
H4qAy4yt0bZS+KnpGqcGP74xKeVpt3oRfO7KatgrR+la6Q9yXBNiK0OhAoGAU7K9
gtY0IW5fAshJbaKcuWw7IlnUZU/bnk0HUFRQisbk7TnIN5kFWOdWG+90J9LhGKfj
L0mGaGWIn7P+xv83w8RITgFiNQm6lNBn1BR6gAPb7urKi8tlqU+DsWgMaEBBYvn2
qjmyVD06HYU/cJMtOYlUJh1C07ZeN5SIYP+BgKECgYAgtfx70F4Wlei7gkQHBdZh
uwB8UBMUZ8/QHu/sW8Nsl4tp/vdsbDaYXwG3b87PgAnp9XIAwxJAHOHw/yVuHAaU
HInNK3ujhFU2Z+YwR+gGhLATlf3s7VHNunRl2mwzeI4Q5mmJvazyBbZv6kbRyJaY
rCRFBES51UWwN7UByA3lqg==
-----END PRIVATE KEY-----
`;

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
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
