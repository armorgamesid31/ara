import crypto from 'crypto';

// 1. Yeni Temiz Bir Anahtar Çifti Üret
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' } // Şifresiz, PKCS8 (En uyumlusu)
});

// 2. Private Key'i Base64'e Çevir (Bütün satır sonlarını yok et)
// Bu işlem anahtarı tek bir uzun string yapar, bozulamaz hale gelir.
const privateKeyBase64 = Buffer.from(privateKey).toString('base64');

console.log("\n👇 COOLIFY 'PRIVATE_KEY' KUTUSUNA BUNU YAPIŞTIR (Tek Satır) 👇");
console.log("---------------------------------------------------------------");
console.log(privateKeyBase64);
console.log("---------------------------------------------------------------");

console.log("\n👇 META'YA BUNU YÜKLE (Public Key) 👇");
console.log("---------------------------------------------------------------");
console.log(publicKey);
console.log("---------------------------------------------------------------");