import crypto from 'crypto';
import https from 'https';

// --- BU AYARLAR SUNUCUNUZDAKİ ÇALIŞAN AYARLARDIR ---
const CONFIG = {
    // Erişim Jetonunuz
    ACCESS_TOKEN: "EAAPZBrqVoIMwBQYZCxZCnKlrEzuCFDnF625X05iSBE5g2FPZCq0IGTTCtcw7bc3HL57KsjHXZAZCf4bekRVSXXJhkgqEVR8iU5dwtTlANK7bVZAZAtsg9ZBLQ1DI2YhlXUjwb8DugL3G2erpu1cNJcgdhymfvt9OY8RZBXiFugrZBZBsZBJTocRVWStF0n9EYDa9WOZBa26wta4UVSBSZCYwWxMCt4y3zZB2gGviDhhKuvSqSjXSZAPSuspbJkGDIsdhEtbFRYmw6stZCMxMjptYK6QJOHDlIRs7hu46VRTW8YsqHdUjgZD",
    
    // Flow ID
    FLOW_ID: "1179430383937978",
    
    // Endpoint Adresiniz
    ENDPOINT_URL: "https://flows.berkai.shop/",
    
    // Sunucuda çalışan, testten geçmiş Private Key
    PRIVATE_KEY: `-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`,

    // Şifreniz
    PASSPHRASE: "berkush"
};

async function forceUpdateMeta() {
    console.log("🛠️  META ZORLA GÜNCELLENİYOR...");

    try {
        // 1. Private Key'den Public Key Türet
        console.log("🔑 [1/3] Public Key türetiliyor...");
        const privKeyObj = crypto.createPrivateKey({
            key: CONFIG.PRIVATE_KEY,
            passphrase: CONFIG.PASSPHRASE
        });
        
        // Meta'nın istediği format (Tek satıra indirgenmiş PEM)
        const publicKeyPem = crypto.createPublicKey(privKeyObj).export({ type: 'spki', format: 'pem' });
        const cleanPublicKey = publicKeyPem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, '');
        
        // API'ye gönderilecek format (Header/Footer tekrar eklenmiş ama tek satır string olarak JSON içinde)
        // Meta API bazen raw string ister. En güvenli yöntem PEM formatını olduğu gibi (satır sonlarıyla) göndermektir.
        // Ancak JSON.stringify bunu escape edeceği için sorun olmaz.
        
        console.log("✅ Anahtar hazır.");

        // 2. Meta API'ye POST İsteği At
        console.log("📡 [2/3] Meta'ya yükleniyor...");
        
        const postData = JSON.stringify({
            endpoint_uri: CONFIG.ENDPOINT_URL,
            application_public_key: publicKeyPem // PEM formatını doğrudan gönderiyoruz
        });

        const options = {
            hostname: 'graph.facebook.com',
            path: `/v21.0/${CONFIG.FLOW_ID}`,
            method: 'POST', // Güncelleme için POST şart
            headers: {
                'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const response = JSON.parse(data);
                
                if (response.success) {
                    console.log("\n🎉 [3/3] İŞLEM BAŞARILI!");
                    console.log("✅ Meta Public Key güncellendi.");
                    console.log("✅ Sunucu ile Meta artık %100 senkronize.");
                    console.log("👉 Şimdi telefonunuzdan Flow'u test edin.");
                } else {
                    console.log("\n❌ META API HATASI:");
                    console.log(JSON.stringify(response, null, 2));
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ Bağlantı Hatası: ${e.message}`);
        });

        req.write(postData);
        req.end();

    } catch (error) {
        console.error("\n❌ BEKLENMEYEN HATA:", error.message);
    }
}

forceUpdateMeta();