const { generarEstadoHospitalario } = require("../../src");
const http = require("http");
const https = require("https");

const API_INGESTA_URL = process.env.API_INGESTA_URL || "http://localhost:3000/api/ingesta/simulacion";

function postConHttp(url, data) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = JSON.stringify(data);

    const options = {
      method: "POST",
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: `${parsed.pathname}${parsed.search}`,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    };

    const client = parsed.protocol === "https:" ? https : http;
    const req = client.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsedResponse = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            body: parsedResponse
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            body: { raw: responseData }
          });
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function enviarSnapshot(opciones = {}) {
  const snapshot = generarEstadoHospitalario(opciones);

  let respuesta;

  if (typeof fetch === "function") {
    const response = await fetch(API_INGESTA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(snapshot)
    });

    let body;

    try {
      body = await response.json();
    } catch (error) {
      body = { raw: await response.text() };
    }

    respuesta = {
      status: response.status,
      body
    };
  } else {
    respuesta = await postConHttp(API_INGESTA_URL, snapshot);
  }

  console.log("Snapshot enviado:");
  console.log(JSON.stringify(snapshot, null, 2));
  console.log("Respuesta backend:");
  console.log(JSON.stringify(respuesta, null, 2));

  return {
    snapshot,
    respuesta
  };
}

if (require.main === module) {
  enviarSnapshot().catch((error) => {
    console.error("Error enviando snapshot:", error.message);
    process.exit(1);
  });
}

module.exports = {
  enviarSnapshot
};
