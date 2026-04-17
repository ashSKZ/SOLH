const { enviarSnapshot } = require("./enviarSnapshot");

const API_INGESTA_URL = process.env.API_INGESTA_URL || "http://localhost:3000/api/ingesta/simulacion";
const modoArg = (process.argv[2] || "normal").toLowerCase();
const modoCrisis = modoArg === "crisis" || process.env.MODO_CRISIS === "true";

let intervalo = null;

async function ciclo() {
  try {
    await enviarSnapshot({ modoCrisis });
  } catch (error) {
    console.error("Error en envio continuo:", error.message);
  }
}

async function iniciarLoop() {
  console.log("Iniciando envio continuo de snapshots...");
  console.log(`URL destino: ${API_INGESTA_URL}`);
  console.log(`Modo: ${modoCrisis ? "CRISIS" : "NORMAL"}`);
  console.log("Intervalo: 2000 ms");
  console.log("Presiona Ctrl + C para detener.");

  await ciclo();

  intervalo = setInterval(() => {
    ciclo();
  }, 2000);
}

process.on("SIGINT", () => {
  if (intervalo) {
    clearInterval(intervalo);
  }

  console.log("\nEnvio continuo finalizado.");
  process.exit(0);
});

iniciarLoop().catch((error) => {
  console.error("No se pudo iniciar el loop:", error.message);
  process.exit(1);
});
