function calcularPrediccion(data) {
  const {
    camas_ocupadas = 0,
    camas_totales = 1,
    pacientes_espera = 0,
    personal_activo = 1,
    tiempo_espera_min = 0
  } = data;

  // 🔧 Feature engineering (simplificado)
  const ocupacion = camas_ocupadas / camas_totales;
  const cargaPersonal = pacientes_espera / personal_activo;
  const presion = pacientes_espera * (tiempo_espera_min || 1);

  // 🔮 Probabilidad (simulada)
  let prob = (ocupacion * 0.5) + (cargaPersonal * 0.3) + (presion / 1000);

  if (prob > 1) prob = 1;

  // 🚦 Clasificación
  let nivel = "bajo";
  if (prob >= 0.7) nivel = "alto";
  else if (prob >= 0.5) nivel = "medio";

  // 📢 Acción
  let accion = "Monitoreo";
  if (nivel === "medio") accion = "Activar protocolo preventivo";
  if (nivel === "alto") accion = "Activar protocolo de emergencia";

  return {
    probabilidad: Number(prob.toFixed(2)),
    nivel_ia: nivel,
    accion
  };
}

module.exports = {
  calcularPrediccion
};