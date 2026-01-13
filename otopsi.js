import crypto from 'crypto';

// 1. LOGLARDAN GELEN ŞİFRELİ PAKET (Son gönderdiğin)
const META_GELEN_PAKET = "DJkREB+rKSgyWIzl8OHJZaAyKU6tNwmM+J/gSMOpSqvB1BKH1RtmHIHY/JyYGOKzTN1HWOoJR67TFUdo0RiOcQy0gRBO19Pte/niWTYreUJmI4l66pyA42BLDeD8kONKQ8wMcbTCyK3ii9Onj29O8POMjg/NIFfPvnBL1y2mUfU1nbdAqsuW9p9DSfGKfDCoC7CXs0f5h4IqK6+zwB51gA0e3uV/GET6ZlfPfHDRkj4bVaWP5Laif91uekdsoU3E6AMJjOE0pbmmUJSdkXudemuWftjEXmp/yD7zrfoSdJKZI7oFAX64OwbNcNke1j9dQlfMlmiMO5DLVw2S2BZKOg==";

// 2. SUNUCUDAKİ ANAHTAR (Coolify'dan kopyala)
const MY_PRIVATE_KEY = `LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQ2t6RE52MU95eU52QjkKSXM0R1B1TzRwTlIzZ0VvQXRUVi9teUZEeFdUOWNhSmFacjZsVkxibm13TmhmaXZ5NlNLNDVFYkwrSzN1dDVoZAo4TndETlBBWGZvOE1ydTR5cWdEK210YXd6NHVac2ZMLzkwdkJZMUZRZUR3bDg0a3ZhVjVvMk9rUXl0dXozY1E5Ci9RZDBpcW4yNTRwVmo5NkJtcWU4SjlDc2oxWTBVS1hibTBIbkhEMEF1S045aCt4RjJBTGw5dXVnSDlWVE1qZDcKZnNPU3B3NW5yRnJmRm4wTVdob1pBN0R5YkhZc3k0d2R2TFM4NU5VTklXR2ZtOEhtb3lLZjFkaUpRNi9RWnNJZQpZQTRIbFg3VExEVTU2dEVkOFVZQXRaQ2ZtQ28xOTJReWZsUFZHT01jQk8yelRCbUNqV2Y4SGNlbllEMmRaNWcxCmJwRmlBS3I3QWdNQkFBRUNnZ0VBTzV0U2hZSWQ1TzRET1RmVURpVkVKNzZTelBCOWs5ajNVMEx3bXJzMHBva3EKQUluR0xqWEFmSEF3bmx4TkdDemtMcnorc0hzdnFqY0U2UUdjQ3Bya3RwTER1Z0l4ek9oNXVKMlh4dGNpOXNJTApFek5HMXRtT0NVMmI3OXd4QkJHWUlOTklKWmRDTlVJaTM0cjhYZFpqMkpieURiV2VkUUZUNXpYOWY5VE9pTmdJCk44NE9vamg1bEI0OGI1ZE0zTU9wZnhlV3ZsVWt2aGdQT0s3cEtvSzNvT2NFaWp3TEpkN1JOOGw3RDhnSnpOSnQKbHNmeWhrT2doL1lQQUlQU2h0VHArQjhERjg1RmQwak9LL3JPbE1VODZCYm5jaUxUTmVwV0tCRWJEbFl3akRQWQpRcmI0Skc0dFI5L2Fld24xVGgrZFJNRUttMkNwOS9yTDRmc2NWelRxTVFLQmdRRE5mTG1CSWloQ1JBdXdmbFNUCmhZNHI1Uy9KOEp6Q2lDeThyeFB1K2kxUnpJelEwWlBibERLK1EycENnS0k1VDg3azQyamhKS3N2QVRnQ3R3dWEKSENQb0tJU0NMZzk5cWgzQUxrYzlWaEEwZjZ3cU5rbGY5bzFUVTAzNWJTcVVHcGFlaTRCWWM5NDFWMDVOVUxUdgpOSEVwdGV0L29Wdkc3bENQYkVZYnRpb1FLd0tCZ1FETlR1UFg2UFBVbGhjcHZmcWdvMklJbThIVFNWWjkzOUY0CmVyZDBtL25UQjdUaDl1bEFDcFllYlMreG5Zc3NJWFdsM3NkTncyUERsb1lqZjdTM2w0ZGJkV2FuUzg0WlBWV0cKV3NQaTNrOEg4clIvR1Z0SXFIVFZHU09WZnlWaStpdVlWaDNXUjFyd3YwajllcW5kMDV4a2xsdllZaFRYeVk2WgpQUjBqWG9LWWNRS0JnQVNuS2x3dU5kTXFUMGx6MHQ1MFM3L2F0TFpSNkhyUE1wUWpNc1JhamVRb1NaZ0E1dVExCit1QXNEcC9xNGNHQ2VTRGR0V1pEdWt5YUxuYUJScFg2eFNWZ3BYOTlJNFNvOFh1RWtNQm16bjhoMVBndnVvR2QKeDUxM2FYQ1lkRHBlVDhMUFRkeXk0dms2UE4rclVDMktkbldIVlFuUzBZMHpvRWRmSUVkSVhMTjVBb0dBVHlkeQpPb1RxdFBSazI4Z04vNjdlRmZtUElkbXRpZnduczI2RW1tV2tUTk0wenNXMktlV3ErUElacUQzWU1WeDVFa2t3CngrOWo0RDJCVytCWm1VckhlZUJxZ21kOGYwaWhWNXBZMlhmaU9tczlZWjh5RFhJOUVRZVBLNDBJcWY5UG5YemUKSmdYK3JzRGc4REZCbW0rQ1pWbCs4WTduQUVjS1BsUk1qcDFhZGxFQ2dZRUFrY3M2KzA3anp4QWJyeEhIYlhFKwpmV3lESVhYaDRpSGIzMVM1ejR4YzVoQ3VRMU90cGRPTkd6YUROZi9PS2pPWEFOUVZPNmRtektDSjFEeWt0dVZXCkVPREJNOGxTaFMzTHpkbDFhS3UxUlpWa0JEMFZEWHdwMXpvZkdncElyTndlWHpGcW5aejh5cW40bkJtOThXZmQKRTA4ZFhmcmlzM3VRWWFkRys0aE1ETEE9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K`;

console.log("🩺 YENİ OTOPSİ (MGF1 DÜZELTMESİ İLE)...");

try {
    // Base64 ise çöz (Coolify'dan nasıl aldığına bağlı, eğer ----- ile başlıyorsa dokunma)
    let finalKey = MY_PRIVATE_KEY.trim();
    if (!finalKey.startsWith('-----BEGIN')) {
        finalKey = Buffer.from(finalKey, 'base64').toString('utf-8');
    }

    const privateKey = crypto.createPrivateKey({
        key: finalKey,
        passphrase: "", // Şifresiz
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
    });

    const decryptedBuffer = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
            // 👇👇👇 İŞTE EKSİK OLAN SİHİRLİ SATIR 👇👇👇
            mgf1Hash: "sha256" 
        },
        Buffer.from(META_GELEN_PAKET, "base64")
    );

    console.log("\n✅ ✅ ✅ EVREKA! ŞİFRE ÇÖZÜLDÜ!");
    console.log("AES Key:", decryptedBuffer.toString('hex'));
    console.log("SORUN: Encryption.js dosyasında 'mgf1Hash' parametresi eksikmiş.");

} catch (error) {
    console.log("\n❌ HATA:", error.message);
}