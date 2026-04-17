const {
  generarEstadoHospitalario,
  reiniciarSimulacion,
  obtenerEstadoActual
} = require("../index");

const camposNuevos = [
  "personal_total",
  "quirofanos_totales",
  "quirofanos_activos",
  "tiempo_espera_min",
  "hora_del_dia"
];

function imprimirSeccion(titulo) {
  console.log("\n============================================");
  console.log(titulo);
  console.log("============================================");
}

function validarCamposNuevos(estado) {
  const faltantes = camposNuevos.filter((campo) => !(campo in estado));

  if (faltantes.length > 0) {
    console.log("Campos faltantes:", faltantes.join(", "));
    return;
  }

  console.log("Campos nuevos presentes: OK");
}

imprimirSeccion("1) ESTADO INICIAL");
const estadoInicial = obtenerEstadoActual();
console.log(JSON.stringify(estadoInicial, null, 2));
validarCamposNuevos(estadoInicial);

imprimirSeccion("2) 5 CICLOS DE SIMULACION NORMAL");
for (let i = 1; i <= 5; i += 1) {
  const resultado = generarEstadoHospitalario();
  console.log(`\nCiclo normal ${i}:`);
  console.log(JSON.stringify(resultado, null, 2));
  validarCamposNuevos(resultado);
}

imprimirSeccion("3) 5 CICLOS DE SIMULACION EN MODO CRISIS");
for (let i = 1; i <= 5; i += 1) {
  const resultado = generarEstadoHospitalario({ modoCrisis: true });
  console.log(`\nCiclo crisis ${i}:`);
  console.log(JSON.stringify(resultado, null, 2));
  validarCamposNuevos(resultado);
}

imprimirSeccion("4) REINICIO DE SIMULACION");
const estadoReinicio = reiniciarSimulacion();
console.log(JSON.stringify(estadoReinicio, null, 2));
validarCamposNuevos(estadoReinicio);
