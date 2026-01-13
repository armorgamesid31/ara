/**
 * src/flow.js
 */
export const getNextScreen = async (decryptedBody) => {
  const { screen, data, action, flow_token } = decryptedBody;

  // 1. Sağlık Kontrolü (Ping)
  if (action === "ping") {
    return {
      data: {
        status: "active",
      },
    };
  }

  // 2. Hata Bildirimi Yönetimi
  if (data?.error) {
    console.warn("Received client error:", data);
    return {
      data: {
        acknowledged: true,
      },
    };
  }

  // 3. Başlangıç (INIT)
  if (action === "INIT") {
    return {
      screen: "START_SCREEN",
      data: {
        // Ekranınız için gerekli başlangıç verileri buraya
        greeting: "Merhaba!",
      },
    };
  }

  // 4. Geri Tuşu (BACK) - Sizin kodunuzdan eklendi
  if (action === "BACK") {
    return {
      screen: screen || "START_SCREEN",
      data: {},
    };
  }

  // 5. Veri Alışverişi (Data Exchange)
  if (action === "data_exchange") {
    // Gelen veriyi işle
    console.info("Flow Input Data:", data);

    // İşlem başarılı, akışı bitir
    return {
      screen: "SUCCESS",
      data: {
        extension_message_response: {
          params: {
            flow_token,
          },
        },
      },
    };
  }

  console.error("Unhandled request body:", decryptedBody);
  throw new Error(
    "Unhandled endpoint request. Make sure you handle the request action & screen logged above."
  );
};