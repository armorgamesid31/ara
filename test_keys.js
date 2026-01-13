import crypto from 'crypto';

// 1. Coolify'daki Mevcut Private Key (Loglardan alındı)
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,83FB33C9D3002AAA

1/lzvizfOiBkfJDVzrFaQq7cCwyJSpCfyAOXdMYJgixw7jlypfQGuePRltn9JnbU
aT5pLIQE7skNQ2ApnMPmzqfTnsx8WehxGB7O13Noygvlo7MzRAijpmay+yzyFFop
yWCsxlk1qg8v9ckxAOFloGk16MeoU8mJIP7KjVLyR6vMjYzYRUTRpC1/tH8MWINF
ZzSGUK63HHXtEAmpjEPoJfDF6QE7389o0jQQJfoROOVT/IsqGYB2X6n+2xeAF7kh
gJ9AgUmRQLItf9CvW8LhLe1AQI45hSd2rV7Lgztzk9Xta4GtoLqEEMa3LZpbPOHm
Uk+st8nw75ia/EskV8yaSMdiPXvGk+fy8oHent1ntwUvtAco5bqk6iNLVHbuxHSe
B3AEBFHllzwCoiVbM4k8YaiNhR/VMmdX8VZ/+kxND/OxI3qP7iZkNNp3XEE07y9c
SPvEzLnqK4/TLvuvxhzRnHXXPwg3cEmbWSYcwFlKSqd6sbfp2uPi4B7jLnDd2D0s
QLNeISDBsj1eMBxklaZ464Tvbs/RL0KMBBfq6yo9Sy3wrMEhh+DDbKZJ/bpniQfP
iNp8wKYSCv3C7eTiDjCjPiBjHzV2bynxfWc5FkpmzG9bdAxDGZMZ/DoGqm22SJux
EEEvfFX6+Qr6aW5LgGTVA4Oglt6yPhnV4EfQ8eKSia3kibRNIjhWMs5/8zXzxdAZ
SN2fIFW9MMGyXaHJdSL02vhGsj9LVl1SJS831Fsot/5aH7CRElVAhfQUUC+rvav+
SRFvfSK8YhkAlwgzRoH0NLSuvYYRzU6Pmddq9oq6QkJhgl8j7kJO1Xk530iLgsEz
XSapjmX2+havsg3OO93w5dwvQR03eFrqT4H8GP3mwB0b06wLMfQoiSbFsPS1KD4c
DtPPQnIY6sLWGci3WpvohVRYtZb+03MXW8updEpFdrBLtWKre77zwDgHlQfc+Nnh
cuqYnxFY2piSBMO+5GQ/HK+fm7e5YvVcADQ2Z1jvdj0K8+h4aYUHPrzun7gltFKZ
ourHU7iqHT6vgeJTD2EMq18serdytndM8ng+m1J5G/heSddLZoegL0e8hikv5S31
4bBS9wK+dszvx+n4eK/knmPP5KKKvl+6Q+VQNvn04MdpAnJvZzBFCYzaK7emXs5J
IMZ1OT1eTpgOV3pxkbMyHigRVChlYevCeYIA3IwIBV/xJb6H0NVs87AtF8PYkfsr
r5Dp41yFYYKRwW7EyUvio38WeDUPG5GsaqTgjSie04h+4LC2Q8d7vycJc9iZdhtP
v/5xOcJeJ5IErpBEpKv/82HLWVkg0kl5PjN5WMqpCl5UnNtJcsjArQZCAFbbEYab
ddFLzx2hBV1vHa3k/kdorF6iXGBMG5MBSifysUVt4hokeUYT+cE1Wo8LRn50xRP5
x4r5WkTQrgO7fAq8yAndFR/kpqpO6VmPTHOamMhT5MDsI1DPf0WhcSI6jP1etUaJ
/7grAXJsdO2LuBVMWNJOIrF9WPxB+BvsQzjLOQgsYDAVVn8q/eYxPCcije4fhBib
fqfyvqPp/IOzylIOnhfqM8yhgY4g5UyCOJcQL8EObZQ3SBCqw6LDnw==
-----END RSA PRIVATE KEY-----`;

const PASSPHRASE = "berkush";

// 2. Meta'ya Gönderdiğinizi Düşündüğümüz Public Key
const PUBLIC_KEY_ON_META = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzdA8QNf7CFzr9EHT5XUT
+D7/mWCrxMAeK4rBmGYEdRe30jO5NHivY7SHbid7qvniHSGStTbzKRHJbX+7CIrU
foLAU8Q3BNm+lL5IKsQqyjJqdBd9TDBxwIsc/e1WuL0INqOVHijDh3qfeWeoOVu7
27tdVo3hD+UrZNVR9L1zvQbvZbBOsZVI8mFXzBEvFws3w5nBK7/E055y0DUErZj+
HjzEw2HrbbA1aQHlhsqJrAQrXgde4jJlm8TWuj9Z7IN/dOnl+cEzzx566pbszFA/
HJoCiP47XDBwHTygHprRe6Atpsasmi/RJT3zgiUpEzTZKy4NG0fDk90MOKjNGvJY
mwIDAQAB
-----END PUBLIC KEY-----`;

console.log("🔍 Anahtar testi başlatılıyor...");

try {
  // 1. Private Key nesnesini oluştur (Şifre testi)
  const privKeyObj = crypto.createPrivateKey({ key: PRIVATE_KEY, passphrase: PASSPHRASE });
  console.log("✅ Private Key şifresi doğru, kilit açıldı.");

  // 2. Private Key'den GERÇEK Public Key'i türet
  const derivedPubKey = crypto.createPublicKey(privKeyObj).export({ type: 'spki', format: 'pem' });

  // 3. Karşılaştırma
  const cleanMetaKey = PUBLIC_KEY_ON_META.replace(/\s+/g, '');
  const cleanDerivedKey = derivedPubKey.replace(/\s+/g, '');

  if (cleanMetaKey === cleanDerivedKey) {
    console.log("\n✅ EŞLEŞME BAŞARILI!");
    console.log("Sonuç: Anahtarlar doğru. Sorun Meta tarafında güncellenmemiş olabilir.");
  } else {
    console.log("\n❌ EŞLEŞME BAŞARISIZ!");
    console.log("Sonuç: Meta'ya gönderdiğiniz anahtar ile Coolify'daki anahtar FARKLI.");
    console.log("\n--- OLMASI GEREKEN PUBLIC KEY (Bunu Meta'ya Gönder) ---");
    console.log(derivedPubKey);
  }

} catch (err) {
  console.error("❌ HATA:", err.message);
}