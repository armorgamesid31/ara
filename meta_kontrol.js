import https from 'https';
import crypto from 'crypto';

// --- AYARLAR ---
const CONFIG = {
    ACCESS_TOKEN: "EAAPZBrqVoIMwBQYZCxZCnKlrEzuCFDnF625X05iSBE5g2FPZCq0IGTTCtcw7bc3HL57KsjHXZAZCf4bekRVSXXJhkgqEVR8iU5dwtTlANK7bVZAZAtsg9ZBLQ1DI2YhlXUjwb8DugL3G2erpu1cNJcgdhymfvt9OY8RZBXiFugrZBZBsZBJTocRVWStF0n9EYDa9WOZBa26wta4UVSBSZCYwWxMCt4y3zZB2gGviDhhKuvSqSjXSZAPSuspbJkGDIsdhEtbFRYmw6stZCMxMjptYK6QJOHDlIRs7hu46VRTW8YsqHdUjgZD",
    FLOW_ID: "1179430383937978",
    // Loglardan aldığımız, sunucuda çalışan Private Key
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
    PASSPHRASE: "berkush"
};

// --- YARDIMCI: Public Key Temizleyici ---
const cleanKey = (k) => k ? k.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s+/g, '') : '';

async function checkMeta() {
    console.log("🕵️  META DEDEKTİFİ BAŞLATILIYOR...\n");

    // 1. Bizim Private Key'den BEKLENEN Public Key'i üret
    console.log("🔑 [LOCAL] Private Key'den Public Key türetiliyor...");
    let localPubKey = "";
    try {
        const privObj = crypto.createPrivateKey({ key: CONFIG.PRIVATE_KEY, passphrase: CONFIG.PASSPHRASE });
        localPubKey = crypto.createPublicKey(privObj).export({ type: 'spki', format: 'pem' });
        console.log("✅ [LOCAL] Anahtar başarıyla türetildi.");
    } catch (e) {
        console.error("❌ [LOCAL] Hata: Private Key okunamadı!", e.message);
        return;
    }

    // 2. Meta'ya sor: "Senin elinde ne var?"
    console.log(`📡 [META] ${CONFIG.FLOW_ID} nolu Flow bilgileri çekiliyor...`);
    
    const options = {
        hostname: 'graph.facebook.com',
        path: `/v21.0/${CONFIG.FLOW_ID}?fields=name,endpoint_uri,application_public_key,status&access_token=${CONFIG.ACCESS_TOKEN}`,
        method: 'GET'
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const response = JSON.parse(data);
            
            if (response.error) {
                console.log("\n❌ [META] API Hatası:");
                console.log(JSON.stringify(response.error, null, 2));
                return;
            }

            console.log("\n📄 [META] MEVCUT DURUM RAPORU:");
            console.log("------------------------------------------------");
            console.log(`🔹 Flow Adı:      ${response.name}`);
            console.log(`🔹 Endpoint URL:  ${response.endpoint_uri}`);
            console.log(`🔹 Status:        ${response.status}`);
            console.log("------------------------------------------------");

            const metaKey = response.application_public_key;
            
            if (!metaKey) {
                console.log("⚠️ [META] Public Key GÖRÜNMÜYOR! (Henüz yüklenmemiş veya API gizliyor)");
            } else {
                // KARŞILAŞTIRMA
                const isMatch = cleanKey(metaKey) === cleanKey(localPubKey);
                
                if (isMatch) {
                    console.log("\n✅ ✅ ✅ MÜKEMMEL! ANAHTARLAR EŞLEŞİYOR!");
                    console.log("Sorun anahtarda DEĞİL. Sorun başka bir yerde (Flow ID, Cache vb.) olabilir.");
                } else {
                    console.log("\n❌ ❌ ❌ KRİTİK UYARI: ANAHTARLAR FARKLI!");
                    console.log("Meta'daki anahtar ile Sunucudaki anahtar UYUŞMUYOR.");
                    console.log("Bu yüzden 'OAEP decoding error' alıyorsunuz.");
                    
                    console.log("\n--- BİZİM OLMASI GEREKEN (Sunucudaki) ---");
                    console.log(localPubKey); 
                    
                    console.log("\n--- META'DAKİ (Yanlış Olan) ---");
                    console.log(metaKey);
                }
            }
        });
    });

    req.on('error', (e) => console.error(`❌ İstek Hatası: ${e.message}`));
    req.end();
}

checkMeta();