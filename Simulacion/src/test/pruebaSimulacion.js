const {
  generarEstadoHospitalario,
  reiniciarSimulacion,
  obtenerEstadoActual
} = require("../index");

function imprimirSeccion(titulo) {
  console.log("\n============================================");
  console.log(titulo);
  console.log("============================================");
}

imprimirSeccion("1) ESTADO INICIAL");
console.log(JSON.stringify(obtenerEstadoActual(), null, 2));

imprimirSeccion("2) 5 CICLOS DE SIMULACION NORMAL");
for (let i = 1; i <= 5; i += 1) {
  const resultado = generarEstadoHospitalario();
  console.log(`\nCiclo normal ${i}:`);
  console.log(JSON.stringify(resultado, null, 2));
}

imprimirSeccion("3) 5 CICLOS DE SIMULACION EN MODO CRISIS");
for (let i = 1; i <= 5; i += 1) {
  const resultado = generarEstadoHospitalario({ modoCrisis: true });
  console.log(`\nCiclo crisis ${i}:`);
  console.log(JSON.stringify(resultado, null, 2));
}

imprimirSeccion("4) REINICIO DE SIMULACION");
console.log(JSON.stringify(reiniciarSimulacion(), null, 2));
