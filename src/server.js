import express from "express";
import crypto from "crypto";
import { getNextScreen } from "./flow.js";

const app = express();
const PORT = process.env.PORT || "3000";

// ⚠️ SENİN VERDİĞİN PRIVATE KEY (Kodun İçine Gömüldü)
const PRIVATE_KEY_RAW = "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCK68cwK5kY2RTs\\ndK2zwtqBzy4jw8KlUc9vxAIR/PE3bDm/eNR+W5oKcogjj0wE5r7HEki0gMxCFi4H\\nMbxyi5akQkVS1tTDaVKIeOggu9OKpecgIq7z8icd3JHxZoU/ffpYNvMNUoTanS2s\\nmjnZ5B3rMxh5sBbnnQED/BdpABZxMwVX+IeV3H7ubCb1Hqak1pnlwMPLatGSFmgl\\nVCWsCR/XFewY91KXJfZ43hb8PaUBdThLPvqErfxIe9kCjs6KfSjkmEG3OzHWxNU+\\n6Ol2mHhN5Dh9aCPuR4NuWWE52CFxTLIypUTvGUkP5U/a8e8MO+rHnxf8GLVpJt4G\\ncboaMgSJAgMBAAECggEAFI/+rUIeyJ9FKhTBK0Txu9oTPcb5lifMWQI9vjTe7XGv\\nAIjdhxB+9gHq5byNp4ISBfxOV61iznti97ykZJ4Fv61xfmf/GSeLSFkBHus+Thzt\\nX4PSupgCszhVP9KJcZLvjcQgaL3onUU7n/s6CebqiMhI3KY0VbcXEeRsAKY7LCkF\\n0vuIy8dpqcHnOMA21ahUr759kW6v0Zh343xrzs1W1b+yMeMo7v3TMzWhJEb+Y/nQ\\n4RXC3seRr+TUsHSOmtFwgO/D36Ice7R4B9+BLf0EG4l9P8hZq1hDAD5dOYbj4uK7\\nytZ6pNkCJMwqZgHc2V87BDJOFDNns9Jrv+wPjoNRswKBgQC9a+u/HUHxV/BaYvE8\\n7CaNLM3ftZqrcqohhJC1y++x1OO9DpMSVGs4cM8mAd7/G6jIVN5QvP0D34bp/EGq\\n35MGW4kLfqjlorBCcaQ62LOJCAE9xakMj4gc6v4U6Wz87XhnPM44hkwhuf4TLxvk\\n5ngqM8L15FgP65aJhBIxFj71+wKBgQC7v9YpK6FxR5Z3lwIu6fDlHydzzy+Hxd9u\\nR99WTBW+oP/YdvcrynmNkIpwaA7MqnsQ/8uVxmm3mJ4Kh2+raO/8LiMuX12h7/6S\\nIg9HnYGmxvWhO+TKjkPv415SFVPQ2aJsaIMnZeu6JoLbILZV2vjhCijXwDqtnNwK\\n0Xhef6GcSwKBgQCZV4prFoZRmD0NDtf317yFwOWQ2nUxogu0QprbcRLDxXHvlKLe\\nzdRWxowLWqxpnLyQIJQwjC3POt7/AKUwbPmaxfM1iP21mHRT9adbtB3zKrXGigMG\\nFhO8RUgXKbh/MMat3H2dKKrtCqJyaUqNjT1t/KUxZf8cND2TaYVIk5e4jQKBgH9b\\nWkMDPbhB/2eQIAMC3k4OHA0K9gr7xtxgFLfNVNLDE8oaqQAjkODes4ocjC15V5Ho\\ncole1kecV1h9FtsHjANcqLDEMBexXNZ0FDlYNqKTQ/vjTQe6CYuoiErV/M0nVG6F\\nVrJbCNR1Wz6ZqhYDO+ArrBjuZN9wEDOmdChmG5KRAoGAGFV3SgqWlpiTOGuG+H91\\nxxKk7TWFg7LNy/e9Q3CawCPNC0QQUrJb5bobyMt+9z9V0TSkwU+ptK3gNTamnAHT\\ny9ykIZVKjDokWckMy93r0QRspOF+em7iQn7FHcLcMLNSKiJK71NZQrenYg89TZAR\\nCd9DECEImUQluvE0GvRtEbA=\\n-----END PRIVATE KEY-----\\n";

// \n karakterlerini gerçek satır sonuna çeviriyoruz
const PRIVATE_KEY = PRIVATE_KEY_RAW.replace(/\\n/g, '\n');

app.use(express.json({
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf?.toString(encoding || "utf8");
  },
}));

// --- ULTRAFIX ŞİFRE ÇÖZÜCÜ (Tüm İhtimalleri Dener) ---
function bruteForceDecrypt(encryptedBase64) {
    const buffer = Buffer.from(encryptedBase64, "base64");
    
    // Meta bazen SHA256/SHA256, bazen SHA256/SHA1 istiyor. Hepsini sırayla deniyoruz.
    const configs = [
        { name: "Standard (SHA256)", oaepHash: "sha256", mgf1Hash: "sha256" },
        { name: "Legacy (SHA1)", oaepHash: "sha256", mgf1Hash: "sha1" },
        { name: "Simple", oaepHash: "sha256" }
    ];

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
            // Başarısız olursa sessizce diğer yönteme geç
        }
    }
    throw new Error("Hiçbir şifreleme yöntemi uymadı.");
}

app.post("/", async (req, res) => {
  try {
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = req.body;

    // 1. Şifreyi Çöz (Brute Force)
    const decryptedAesKey = bruteForceDecrypt(encrypted_aes_key);

    // 2. Veriyi Aç
    const flowDataBuffer = Buffer.from(encrypted_flow_data, "base64");
    const ivBuffer = Buffer.from(initial_vector, "base64");
    const authTag = flowDataBuffer.subarray(-16);
    const encBody = flowDataBuffer.subarray(0, -16);

    const decipher = crypto.createDecipheriv("aes-128-gcm", decryptedAesKey, ivBuffer);
    decipher.setAuthTag(authTag);
    const decryptedJSON = Buffer.concat([decipher.update(encBody), decipher.final()]).toString("utf-8");
    
    // 3. Yanıtla
    const responseData = await getNextScreen(JSON.parse(decryptedJSON));

    const flippedIv = Buffer.from(ivBuffer.map(b => ~b));
    const cipher = crypto.createCipheriv("aes-128-gcm", decryptedAesKey, flippedIv);
    const encryptedResponse = Buffer.concat([
      cipher.update(JSON.stringify(responseData), "utf-8"),
      cipher.final(),
      cipher.getAuthTag()
    ]).toString("base64");

    res.send(encryptedResponse);

  } catch (error) {
    console.error("KRİTİK HATA:", error.message);
    res.status(500).send();
  }
});

app.get("/", (req, res) => res.send("Ultrafix Server Active"));
app.listen(PORT, () => console.log(`Server running on ${PORT}`));