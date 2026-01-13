import crypto from "crypto";

// 1. Private Key
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,BD27CA1C1A950E91

i6Dv7i3gKjTW11fjxYFeYeetgAYOJviAMMruwFnxlkud9nAP/Hg3Ra68tdA73U5D
zJDOeQ5x7bVLw/e7O9X2FIyV25jpBmYRKWBka2LagECfjIolUh/jMeW6+YLgftm4
dsFNDszCRgoJ+yrxUOw8R3vsAf/1/huGDPwf46j/7q2WkQ0lm6aceNVkTkeeXHnU
tb0RwZ0KX3SlMidMArKtcasaQ7JBfp5uSXzNQtiQXIwOX99X6BJyGEJd3GA6s0Ps
V1+0kGR+rG8RJr5D3eFxEUI7YFZxcfvN7MZb5d640433yf4sut/3nJD6zxTJ8edR
WVhBBIbM6MqJX0Viz49X3UKtyif733ERxPI9TGO3hEhJhd6+5xawSwUcXoMMmBoE
IckJ2vD4czX7f819YiovC8RT8uvBFT7BxvaKiBX0g5DZrmCXvv9OTt0cD5ecWTEZ
7yeHodjD/vS28ZygOUuo6JqUgIKA1sO2ysxycjfMJq9eBALSEksfxWXz2Ke+14oZ
EB0d1vwZMuSUHojNfLz1tl4JYEZ83iSS9ApESK/MIxYu7MgN4mTBhQeAX4pV34q/
MZ/oftrgx3onCFgzdvFKupM9rtpm1Kucj/6d8qiCv7CV5WNSkDYr8vzVEXrpkAyz
8uidllgVqnQ9sea3HY0Dz/MwD0F1xUSAB5Uqp3jKbkIArkTxUqQ+Rf4vp2Q5Jn9A
fQAky2Is7O4POmnsOeFHkWKWu/g+Ti1fDxM+UYV6T+KR+XllXNyqAuJAIPnUSSTY
GNELq2VCtLeNdj93icdrpQ2WFLwntxPbO72Ljc1SIjsKWrNJchVkSUiKEmOF0B7L
qtis5MZPaoa0srBkdQKwpRjfdVw1kfnScHbb9c7NEP31fUxZnEiQz4jEwurXqNa3
jB5oCaMnnymHiY4OFMnB4qW9HARxjLkCJFjjTU1AgN7Ar8gerqSsmY5sylXauLF3
ffrdTJ7eMxK4PA2tnYLFqPKA+nzpPhLKX0dEjtdHWx4AtoQXLexVfjPsaKRiyQKA
PwInk1leXxZA6t7qqCAEoY8fV/RVX5oV5ZqlgsEqvjBqCo6EcXznOLEakiu8Nk1P
lOxBT8AKxL+mtsB7TSYKGjV5OZjXFBL8GtJx7sKxZh8G0TDejKiElJze0U/w3xbF
kXBHUA64oOn8j6OXcMVFo2j2tuvZhTQdAOT2DUYvzJz3RM7EBPH0SayJafxKv7pq
2udfvKIa00imMk728nAfDrwTFw+7XYNekp7kY8pmIFI8ISbhWBzCKDJUNBLcSfHK
BR685jUGEd9RobMo5AHARxh2Ga/QgjrF6XHr0TxCCFOQRE9fLcgO1bDIthnnoUdN
K/C18PHUFPt3J2c3avAp+VQ1V9tSb715ZJ08FghSOHLsAfP3lBQO30nAD/ME76HA
AJzw/bREbi4rkzOj5+CnZWUmxeruY+Tqiar5gKayrpxgxEOv60DgPVDarT7LUu9a
5zuQm6xBugNZ1L2VyaQHTjRpoTPVhj6Gswwn5CgYkJnawXJbWudgbneVADBN447w
yQBDAnN/dII0WgCqkP86zsVpkb3TA6AK+kAvO/yR49gMYHVhIBnuxoDVGdoSABsz
-----END RSA PRIVATE KEY-----`;

// 2. Şifre (Hata 'bad decrypt' değilse şifreniz muhtemelen doğrudur)
const PASSPHRASE = "GÜÇLÜ_BIR_SIFRE_BELIRLEYIN"; 

try {
  // Private Key nesnesini oluştur
  const privateKeyObject = crypto.createPrivateKey({
    key: PRIVATE_KEY,
    passphrase: PASSPHRASE,
  });

  // --- DÜZELTİLEN KISIM BAŞLANGIÇ ---
  // Private Key'den Public Key nesnesini türet
  const publicKeyObject = crypto.createPublicKey(privateKeyObject);
  
  // Şimdi Public Key'i dışarı aktar
  const publicKey = publicKeyObject.export({
    type: "spki",
    format: "pem",
  });
  // --- DÜZELTİLEN KISIM BİTİŞ ---

  console.log("\n✅ İŞTE META'YA GÖNDERMEN GEREKEN PUBLIC KEY:\n");
  console.log(publicKey);
  console.log("\nBunu kopyalayıp Meta güncelleme komutundaki RAW_PUB_KEY kısmına yapıştırabilirsin.\n");

} catch (error) {
  console.error("\n❌ HATA OLUŞTU!");
  console.error("Hata Detayı:", error.message);
  if (error.code === 'ERR_OSSL_EVP_BAD_DECRYPT') {
      console.error("⚠️  ŞİFRE YANLIŞ: 'GÜÇLÜ_BIR_SIFRE_BELIRLEYIN' şifresi bu anahtarı açamadı.");
  }
}