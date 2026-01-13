
import express from "express";
import crypto from "crypto";
import { getNextScreen } from "./flow.js";

const app = express();
const PORT = process.env.PORT || "3000";
const APP_SECRET = process.env.APP_SECRET;

// 🔒 SABİT PRIVATE KEY (Otomatik Gömüldü)
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDcS63dK9HWR8lr
5XEyyh9jKA9yVNxJCNa74LnnyVXNbixToGd1/Wea1rd6DQGUmzszYu04UCIBvUnT
BCBUVrvICT3qj4pH6GHpTR4KZz4e0p3AtTz9rmDJYnfetebvmCMVjtvJMKH+hlm9
O267RTpIz3YW1p0RhycvKi7cS1CsqOqMYNtCt0cx3DLHPMDrd8sOUlRtmW58Tq/j
OI1lMfm+sfQSpHmmuhfGKcC7gZ2mxMye3guzZHk1yVMkhilnvW7YbC+L5t9kKIIV
hatp1j3FXD+uU7jWGPqoN+qCAU1RVsJOwn1Uiw8rJclGNj10YJiKLEYsLT5XN7iU
QghhPF4DAgMBAAECggEACeiEJxN7z6XQ7b/ByfqvU2K6NyE7+zOg5423BDGDthwD
dbYcO9asR0RAYlvyu0AJd0k2yYvzy5zmP3h1tSAQOBy6TTIsPQm7BabzTUfRfR9p
+wCWgAPM1KH6KZPdkYndN3CtJVfA9tViHzxswZLeiTx+NOQYPRvqwO37x5Vs89Gx
GRGQeu4p65Vh4JRSpbTddYTRIr4gk3asDxebh9Qr/Z92H54akSNs+NcRqCLSfiuK
zPrED+hivb29vkL/GtBkA3JrthqIuMK7ltVajvhV5xaMgMwwSKwETMZIofLIiw+1
L5JznKf7XGJwnhj881tUoaAZq/knKZhts2ctWCyd2QKBgQD0sJBd4wfbshU7rhvG
VkBHmhpap0e3wCzWxfn0CiPigWtdxphLScqT9HJfCmpeZ5DpyhYTr0ZzDEdD27SF
a36s8pNgPDN6hK9n6jekbJ1QUP5NzlCmPBqWZ+JWHVupQa2Swf4ZhAJha1hhsfl3
c2njTGAl+dKR7AmVVLn3NnIiBQKBgQDmenUxgx8P3fs8o1hW5m73XPorbqqXA0wg
d1XSADVkD2Fqk5dEZsdwdTgicsdoYn0wSJZuxCEJTn4UnGO+3evGObRoFwZ+fx5m
86s9TJT/dAnLmkyvHUhF5sWbjW38fH0wp5OuUjRvL8RmsV2n5TSpLF05O0ktHu8W
yRwi8MdWZwKBgBOVMeihq9ZUWUiudYCZFInmdmd87ctx8OS7cXarfRW6n9ogc73K
yRCwRpr+nWayyTE8wCmRJIU+nVF7+uWWpcu3mj3gc4pBpjwdzZg2LRzpboDRmzjC
pKoW5FFaBiT0oayWI/zsyLf9PFSNRtbdgML1MNi5NrYA+v9diYiUbev1AoGAQDZv
/kps1gvfmmZcD2IGGo7h+EXN62L0y7rTwz1hoq4SUxIpu9nyyOcvq5FU80U1YcVn
fBbSqXgf8ngb5iqILOMY20NHAOlDvCU5WUvD22Ql8n7bzJIY97iy54LA2O6KJosZ
vyCSEUQ6sO3LjSJzyIpesrpMyfBrZmrDlwyETRMCgYEA3nr0SddQJ6at9ks8NOEU
hraIaYxejZZcZTdUp5er1nirdiUj4vdJjjmrQdGltyAzllAF0/JNAnSu77bLdEKm
cgkJAAe0WkIb9zptVYrdLKk41ez228IobJODq4rMO6Hwd3L8A5q+JAJKWpw0Jw/a
mZHYorhGIIK2BMehuD63nuc=
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
