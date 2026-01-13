
import https from 'https';
const data = JSON.stringify({
  endpoint_uri: "https://flows.berkai.shop",
  application_public_key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtIRbAXR6JYf8Os+b48ygXCOOCWNJ2d6mHGSLa6ypimOZ/IDSK2To9SSKPLP6dx8aU3kOB8ddOQ5iVmDBi7hhr5mqKJK3xmFidt2pcmCSZtdaMJJG4PWIKn5JTO2kisLgzTC8c0kzTNyA4TmDPxU8UQZaUrpPiH8LWD8L5bAHcB/XJKC/rOE3Ui+bwd4VsltZE6obkSWtVHI82P8TPEx0qGMxmOLrY22A+7PDQIPRBCzKMT89WNXMca+y1u6VYkaOirMeXwSqmP2Ekpv8J0mj0Dp/5nCs5v4nnTsgY7DNmNdBKtW1aL2i7zA53S3IVUEpzic8N7/CqkOGVY0VovDVawIDAQAB"
});
const options = {
  hostname: 'graph.facebook.com',
  path: '/v21.0/25314368698232998', // Flow ID
  method: 'POST',
  headers: {
    'Authorization': 'Bearer EAAPZBrqVoIMwBQf9imHCvdAEz9quSeHgGslvbTNd9oUQV2ZBQ0UoA6ZCBdEYTZCqhrVvGDR3SZAIhI6fTfPOJk5v9glOnj4eQjAA2xKk5JSyFyGtxYaY27QZBCEZBlm63xafPaGaH6raDinHITw37PHVXGZA5O39dZAaAGgaZBxL8nNcQaOTuNKI9ijNlhkIGTwek9vRyyihmCZBxWLG5FS4qstaFUCeUijrYAcsm9Y7s20GXNzCZBf7Qxebee77AxkbwjzPT7XxbVnAe4pfD4sptZBTRok6QahriCSeh3puigQZDZD',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = https.request(options, res => {
  res.on('data', d => process.stdout.write(d));
});
req.write(data);
req.end();