import express from "express";
import crypto from "crypto";
import { getNextScreen } from "./flow.js";

const app = express();
const PORT = process.env.PORT || "3000";

// 🔐 SENİN VERDİĞİN PRIVATE KEY (Meta'daki Public Key'in Eşi)
// \n karakterleri otomatik düzeltilecek şekilde ayarlandı.
const PRIVATE_KEY_RAW = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCK68cwK5kY2RTs
dK2zwtqBzy4jw8KlUc9vxAIR/PE3bDm/eNR+W5oKcogjj0wE5r7HEki0gMxCFi4H
Mbxyi5akQkVS1tTDaVKIeOggu9OKpecgIq7z8icd3JHxZoU/ffpYNvMNUoTanS2s
mjnZ5B3rMxh5sBbnnQED/BdpABZxMwVX+IeV3H7ubCb1Hqak1pnlwMPLatGSFmgl
VCWsCR/XFewY91KXJfZ43hb8PaUBdThLPvqErfxIe9kCjs6KfSjkmEG3OzHWxNU+
6Ol2mHhN5Dh9aCPuR4NuWWE52CFxTLIypUTvGUkP5U/a8e8MO+rHnxf8GLVpJt4G
cboaMgSJAgMBAAECggEAFI/+rUIeyJ9FKhTBK0Txu9oTPcb5lifMWQI9vjTe7XGv
AIjdhxB+9gHq5byNp4ISBfxOV61iznti97ykZJ4Fv61xfmf/GSeLSFkBHus+Thzt
X4PSupgCszhVP9KJcZLvjcQgaL3onUU7n/s6CebqiMhI3KY0VbcXEeRsAKY7LCkF
0vuIy8dpqcHnOMA21ahUr759kW6v0Zh343xrzs1W1b+yMeMo7v3TMzWhJEb+Y/nQ
4RXC3seRr+TUsHSOmtFwgO/D36Ice7R4B9+BLf0EG4l9P8hZq1hDAD5dOYbj4uK7
ytZ6pNkCJMwqZgHc2V87BDJOFDNns9Jrv+wPjoNRswKBgQC9a+u/HUHxV/BaYvE8
7CaNLM3ftZqrcqohhJC1y++x1OO9DpMSVGs4cM8mAd7/G6jIVN5QvP0D34bp/EGq
35MGW4kLfqjlorBCcaQ62LOJCAE9xakMj4gc6v4U6Wz87XhnPM44hkwhuf4TLxvk
5ngqM8L15FgP65aJhBIxFj71+wKBgQC7v9YpK6FxR5Z3lwIu6fDlHydzzy+Hxd9u
R99WTBW+oP/YdvcrynmNkIpwaA7MqnsQ/8uVxmm3mJ4Kh2+raO/8LiMuX12h7/6S
Ig9HnYGmxvWhO+TKjkPv415SFVPQ2aJsaIMnZeu6JoLbILZV2vjhCijXwDqtnNwK
0Xhef6GcSwKBgQCZV4prFoZRmD0NDtf317yFwOWQ2nUxogu0QprbcRLDxXHvlKLe
zdRWxowLWqxpnLyQIJQwjC3POt7/AKUwbPmaxfM1iP21mHRT9adbtB3zKrXGigMG
FhO8RUgXKbh/MMat3H2dKKrtCqJyaUqNjT1t/KUxZf8cND2TaYVIk5e4jQKBgH9b
WkMDPbhB/2eQIAMC3k4OHA0K9gr7xtxgFLfNVNLDE8oaqQAjkODes4ocjC15V5Ho
cole1kecV1h9FtsHjANcqLDEMBexXNZ0FDlYNqKTQ/vjTQe6CYuoiErV/M0nVG6F
VrJbCNR1Wz6ZqhYDO+ArrBjuZN9wEDOmdChmG5KRAoGAGFV3SgqWlpiTOGuG+H91
xxKk7TWFg7LNy/e9Q3CawCPNC0QQUrJb5bobyMt+9z9V0TSkwU+ptK3gNTamnAHT
y9ykIZVKjDokWckMy93r0QRspOF+em7iQn7FHcLcMLNSKiJK71NZQrenYg89TZAR
Cd9DECEImUQluvE0GvRtEbA=
-----END PRIVATE KEY-----`;

const PRIVATE_KEY = PRIVATE_KEY_RAW.replace(/\\n/g, '\n');

app.use(express.json({
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf?.toString(encoding || "utf8");
  },
}));

// --- ŞİFRE ÇÖZÜCÜ (Tüm İhtimalleri Dener) ---
function bruteForceDecrypt(encryptedBase64) {
    const buffer = Buffer.from(encryptedBase64, "base64");
    
    // Meta bazen SHA256/SHA256, bazen SHA256/SHA1 istiyor. Hepsini deniyoruz.
    const configs = [
        { name: "Standard (SHA256)", oaepHash: "sha256", mgf1Hash: "sha256" },
        { name: "Legacy (SHA1)", oaepHash: "sha256", mgf1Hash: "sha1" },
        { name: "Simple", oaepHash: "sha256" }
    ];

    let lastError;
    for (const config of configs) {
        try {
            const options = {
                key: PRIVATE_KEY,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: config.oaepHash
            };
            if (config.mgf1Hash) options.mgf1Hash = config.mgf1Hash;

            const decrypted = crypto.privateDecrypt(options, buffer);
            console.log(`✅ Şifre çözüldü! Yöntem: ${config.name}`);
            return decrypted;
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError;
}

app.post("/", async (req, res) => {
  try {
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = req.body;

    // 1. Şifreyi Çöz
    const decryptedAesKey = bruteForceDecrypt(encrypted_aes_key);

    // 2. Veriyi Aç
    const flowDataBuffer = Buffer.from(encrypted_flow_data, "base64");
    const ivBuffer = Buffer.from(initial_vector, "base64");
    const authTag = flowDataBuffer.subarray(-16);
    const encBody = flowDataBuffer.subarray(0, -16);

    const decipher = crypto.createDecipheriv("aes-128-gcm", decryptedAesKey, ivBuffer);
    decipher.setAuthTag(authTag);
    const decryptedJSON = Buffer.concat([decipher.update(encBody), decipher.final()]).toString("utf-8");
    const decryptedBody = JSON.parse(decryptedJSON);

    // 3. Yanıt Hazırla (Ping mi Normal mi?)
    let responseData;
    if (decryptedBody.action === 'ping') {
        console.log("🔔 Sağlık Kontrolü (Ping) Geldi - 'Active' dönülüyor.");
        responseData = { data: { status: "active" } };
    } else {
        console.log("📨 Flow İsteği Geldi:", decryptedBody.action);
        responseData = await getNextScreen(decryptedBody);
    }

    // 4. Yanıtı Şifrele ve Gönder
    const flippedIv = Buffer.from(ivBuffer.map(b => ~b));
    const cipher = crypto.createCipheriv("aes-128-gcm", decryptedAesKey, flippedIv);
    const encryptedResponse = Buffer.concat([
      cipher.update(JSON.stringify(responseData), "utf-8"),
      cipher.final(),
      cipher.getAuthTag()
    ]).toString("base64");

    res.send(encryptedResponse);

  } catch (error) {
    console.error("❌ KRİTİK HATA:", error.message);
    res.status(500).send();
  }
});

app.get("/", (req, res) => res.send("Ultrafix Server Active"));
app.listen(PORT, () => console.log(`Server running on ${PORT}`));