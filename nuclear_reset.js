import crypto from 'crypto';
import https from 'https';

// --- AYARLAR ---
const CONFIG = {
    ACCESS_TOKEN: "EAAPZBrqVoIMwBQYZCxZCnKlrEzuCFDnF625X05iSBE5g2FPZCq0IGTTCtcw7bc3HL57KsjHXZAZCf4bekRVSXXJhkgqEVR8iU5dwtTlANK7bVZAZAtsg9ZBLQ1DI2YhlXUjwb8DugL3G2erpu1cNJcgdhymfvt9OY8RZBXiFugrZBZBsZBJTocRVWStF0n9EYDa9WOZBa26wta4UVSBSZCYwWxMCt4y3zZB2gGviDhhKuvSqSjXSZAPSuspbJkGDIsdhEtbFRYmw6stZCMxMjptYK6QJOHDlIRs7hu46VRTW8YsqHdUjgZD",
    FLOW_ID: "1179430383937978",
    ENDPOINT_URL: "https://flows.berkai.shop" // Sonunda slash yok
};

async function resetKeys() {
    console.log("☢️  NÜKLEER RESET BAŞLATILIYOR...");

    // 1. ŞİFRESİZ (Plain) Anahtar Çifti Oluştur
    // Passphrase YOK, Cipher YOK. Dümdüz metin.
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' } // Şifreleme yok!
    });

    console.log("✅ Yeni ŞİFRESİZ anahtar çifti oluşturuldu.");

    // 2. Meta'ya Yükle
    const cleanPublicKey = publicKey
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/[\r\n\s]/g, '');

    const postData = JSON.stringify({
        endpoint_uri: CONFIG.ENDPOINT_URL,
        application_public_key: cleanPublicKey
    });

    const options = {
        hostname: 'graph.facebook.com',
        path: `/v21.0/${CONFIG.FLOW_ID}`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log("📡 Meta güncelleniyor...");

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const result = JSON.parse(data);
            if (result.success) {
                console.log("\n✅ META GÜNCELLEMESİ BAŞARILI!");
                console.log("---------------------------------------------------");
                console.log("👇 AŞAĞIDAKİ PRIVATE KEY'İ COOLIFY'A YAPIŞTIRIN 👇");
                console.log("---------------------------------------------------");
                console.log(privateKey);
                console.log("---------------------------------------------------");
                console.log("⚠️  ÖNEMLİ: Coolify'daki 'PASSPHRASE' değişkenini TAMAMEN SİLİN veya BOŞ BIRAKIN.");
                console.log("---------------------------------------------------");
            } else {
                console.error("❌ Meta Hatası:", JSON.stringify(result, null, 2));
            }
        });
    });

    req.write(postData);
    req.end();
}

resetKeys();