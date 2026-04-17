const {
  generarEstadoHospitalario,
  reiniciarSimulacion
} = require("../../src");

let modoCrisis = false;
let intervalo = null;

function barra(valor, maximo, largo = 30) {
  const proporcion = Math.min(valor / maximo, 1);
  const llenos = Math.round(proporcion * largo);
  const vacios = largo - llenos;

  return "█".repeat(llenos) + "░".repeat(vacios);
}

function calcularNivel(estado) {
  const ocupacion = estado.camas_ocupadas / estado.camas_totales;

  if (estado.camas_disponibles <= 5 || ocupacion >= 0.9) {
    return "ALTO";
  }

  if (estado.camas_disponibles <= 10 || ocupacion >= 0.7) {
    return "MEDIO";
  }

  return "BAJO";
}

function mostrarDashboard(estado) {
  const nivel = calcularNivel(estado);

  console.clear();

  console.log("==================================================");
  console.log("          SOLH - MONITOR DE SIMULACION");
  console.log("==================================================");
  console.log(`Area monitoreada:          ${estado.area}`);
  console.log(`Modo actual:               ${modoCrisis ? "CRISIS" : "NORMAL"}`);
  console.log(`Hora:                      ${estado.timestamp}`);
  console.log("--------------------------------------------------");

  console.log(`Pacientes en espera:       ${estado.pacientes_espera}`);
  console.log(`Pacientes atendidos:       ${estado.pacientes_atendidos}`);
  console.log(`Personal activo:           ${estado.personal_activo}`);

  console.log("--------------------------------------------------");

  console.log(`Camas totales:             ${estado.camas_totales}`);
  console.log(`Camas ocupadas:            ${estado.camas_ocupadas}`);
  console.log(`Camas disponibles:         ${estado.camas_disponibles}`);

  console.log("");
  console.log("Ocupacion de camas:");
  console.log(`[${barra(estado.camas_ocupadas, estado.camas_totales)}]`);
  console.log("");

  console.log("Movimiento del ciclo:");
  console.log(`Nuevos pacientes:          ${estado.nuevos_pacientes}`);
  console.log(`Atendidos en ciclo:        ${estado.pacientes_atendidos_ciclo}`);
  console.log(`Pacientes con cama:        ${estado.pacientes_con_cama}`);
  console.log(`Altas hospitalarias:       ${estado.altas_ciclo}`);

  console.log("--------------------------------------------------");
  console.log(`Nivel de saturacion:       ${nivel}`);

  if (nivel === "ALTO") {
    console.log("ALERTA: Riesgo alto de saturacion hospitalaria.");
  } else if (nivel === "MEDIO") {
    console.log("AVISO: La ocupacion esta aumentando.");
  } else {
    console.log("Estado operativo estable.");
  }

  console.log("==================================================");
  console.log("Controles:");
  console.log("[C] Activar/desactivar modo crisis");
  console.log("[R] Reiniciar simulacion");
  console.log("[Q] Salir");
  console.log("==================================================");
}

function actualizar() {
  const estado = generarEstadoHospitalario({
    modoCrisis
  });

  mostrarDashboard(estado);
}

function iniciarMonitor() {
  actualizar();

  intervalo = setInterval(() => {
    actualizar();
  }, 2000);
}

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.on("data", (tecla) => {
  const opcion = tecla.toLowerCase();

  if (opcion === "c") {
    modoCrisis = !modoCrisis;
    actualizar();
  }

  if (opcion === "r") {
    reiniciarSimulacion();
    actualizar();
  }

  if (opcion === "q") {
    clearInterval(intervalo);
    console.clear();
    console.log("Monitor finalizado.");
    process.exit();
  }
});

iniciarMonitor();
