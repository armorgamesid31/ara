/**
 * src/keyGenerator.js
 * GÜNCELLENMİŞ SÜRÜM: Meta uyumlu PKCS8 formatında anahtar üretir.
 */
import crypto from "crypto";

// Şifreyi argüman olarak al
const passphrase = process.argv[2];
if (!passphrase) {
  throw new Error(
    "Lütfen şifreyi argüman olarak girin: node src/keyGenerator.js <sifreniz>"
  );
}

try {
  const keyPair = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8", // ÖNEMLİ DEĞİŞİKLİK: pkcs1 yerine pkcs8
      format: "pem",
      cipher: "des-ede3-cbc",
      passphrase,
    },
  });

  console.log(`
✅ ANAHTARLAR BAŞARIYLA OLUŞTURULDU!

👇 AŞAĞIDAKİLERİ .env DOSYANIZA VEYA COOLIFY'A KAYDEDİN 👇
===========================================================
PASSPHRASE="${passphrase}"

PRIVATE_KEY="${keyPair.privateKey.replace(/\n/g, '\\n')}"
===========================================================

👇 AŞAĞIDAKİ PUBLIC KEY'İ META'YA YÜKLEYİN 👇
===========================================================
${keyPair.publicKey}
===========================================================
`);

} catch (err) {
  console.error("Anahtar oluşturulurken hata çıktı:", err);
}