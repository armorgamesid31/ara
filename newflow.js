import https from 'https';

const CONFIG = {
    // Senin verdiğin Yeni Flow ID
    FLOW_ID: "839862575701854",
    
    // Senin verdiğin Token
    ACCESS_TOKEN: "EAAPZBrqVoIMwBQeoQM0tMvG1pUZBIVeQHQb0fIpy6dbUPwFQ20QxrKbXVu3PhgP7jW74Qhd9a4SZCGDxOUzEgaIhVno73d5tsQcCYM8VgHpwHctR2W66ASHF9HbcSfhI6da3JZBZCUXEjMbwrylvRvjNjAAI2ucUJpZCts7zTRgl5e1UjDAqr0iTBzaBdH1A8LxRSYHYBEYplug4gNycgCBx4zb722W9GlFeC9K8jbWBOHs8d3VY6lWsBkH7pelhRrcUzlUps710tCKNubCxBpep5ZAHwP3oGSf2neMSgZDZD",
    
    ENDPOINT_URI: "https://flows.berkai.shop",
    
    // DÜZELTME: Backtick (`) kullanıldı, hata vermez.
    PUBLIC_KEY: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiuvHMCuZGNkU7HSts8La
gc8uI8PCpVHPb8QCEfzxN2w5v3jUfluaCnKII49MBOa+xxJItIDMQhYuBzG8couW
pEJFUtbUw2lSiHjoILvTiqXnICKu8/InHdyR8WaFP336WDbzDVKE2p0trJo52eQd
6zMYebAW550BA/wXaQAWcTMFV/iHldx+7mwm9R6mpNaZ5cDDy2rRkhZoJVQlrAkf
1xXsGPdSlyX2eN4W/D2lAXU4Sz76hK38SHvZAo7Oin0o5JhBtzsx1sTVPujpdph4
TeQ4fWgj7keDbllhOdghcUyyMqVE7xlJD+VP2vHvDDvqx58X/Bi1aSbeBnG6GjIE
iQIDAQAB
-----END PUBLIC KEY-----`
};

console.log(`📡 Meta'ya Bağlanılıyor... (Flow ID: ${CONFIG.FLOW_ID})`);

const data = JSON.stringify({
  endpoint_uri: CONFIG.ENDPOINT_URI,
  application_public_key: CONFIG.PUBLIC_KEY
});

const options = {
  hostname: 'graph.facebook.com',
  path: `/v21.0/${CONFIG.FLOW_ID}`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, res => {
  let responseData = '';
  res.on('data', d => responseData += d);
  res.on('end', () => {
    try {
        const json = JSON.parse(responseData);
        if (json.success) {
            console.log("\n✅ BAŞARILI! Meta güncellendi.");
            console.log("👉 Şimdi server.js dosyasını güncelle ve deploy et.");
        } else {
            console.log("\n❌ HATA:", JSON.stringify(json, null, 2));
        }
    } catch (e) {
        console.log("Ham Cevap:", responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(`İstek Hatası: ${e.message}`);
});

req.write(data);
req.end();