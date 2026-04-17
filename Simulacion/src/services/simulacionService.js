const estadoInicial = require("../config/estadoInicial");
const { numeroAleatorio } = require("../utils/random");

let estadoActual = { ...estadoInicial };
const personalTotal = 12;
const quirofanosTotales = 6;
const quirofanosActivos = 4;

function construirEstadoBase(ahora) {
  const timestamp = ahora.toISOString();
  const horaDelDia = ahora.getHours();
  const tiempoEsperaMin = Math.round(
    (estadoActual.pacientes_espera / Math.max(1, estadoActual.personal_activo)) * 8
  );

  return {
    area: estadoActual.area,
    pacientes_espera: estadoActual.pacientes_espera,
    pacientes_atendidos: estadoActual.pacientes_atendidos,
    camas_totales: estadoActual.camas_totales,
    camas_ocupadas: estadoActual.camas_ocupadas,
    camas_disponibles: estadoActual.camas_disponibles,
    personal_activo: estadoActual.personal_activo,
    personal_total: personalTotal,
    quirofanos_totales: quirofanosTotales,
    quirofanos_activos: quirofanosActivos,
    tiempo_espera_min: tiempoEsperaMin,
    hora_del_dia: horaDelDia,
    timestamp
  };
}

function simularLlegadaPacientes(modoCrisis = false) {
  if (modoCrisis) {
    return numeroAleatorio(20, 40);
  }

  return numeroAleatorio(3, 15);
}

function simularAtencionPacientes(personalActivo) {
  return numeroAleatorio(personalActivo, personalActivo * 3);
}

function simularOcupacionCamas(pacientesAtendidos) {
  return Math.round(pacientesAtendidos * 0.3);
}

function simularAltas() {
  return numeroAleatorio(0, 5);
}

function generarEstadoHospitalario(opciones = {}) {
  const { modoCrisis = false } = opciones;

  const nuevosPacientes = simularLlegadaPacientes(modoCrisis);
  const totalPacientesDisponibles = estadoActual.pacientes_espera + nuevosPacientes;

  const pacientesAtendidosSimulados = simularAtencionPacientes(estadoActual.personal_activo);
  const pacientesAtendidosCiclo = Math.min(pacientesAtendidosSimulados, totalPacientesDisponibles);

  const pacientesConCama = simularOcupacionCamas(pacientesAtendidosCiclo);
  const altasCiclo = simularAltas();

  estadoActual.pacientes_espera = totalPacientesDisponibles - pacientesAtendidosCiclo;
  estadoActual.pacientes_atendidos += pacientesAtendidosCiclo;

  const camasOcupadasActualizadas = estadoActual.camas_ocupadas + pacientesConCama - altasCiclo;
  estadoActual.camas_ocupadas = Math.max(0, Math.min(camasOcupadasActualizadas, estadoActual.camas_totales));
  estadoActual.camas_disponibles = estadoActual.camas_totales - estadoActual.camas_ocupadas;

  const estadoBase = construirEstadoBase(new Date());

  return {
    area: estadoBase.area,
    pacientes_espera: estadoBase.pacientes_espera,
    pacientes_atendidos: estadoBase.pacientes_atendidos,
    camas_totales: estadoBase.camas_totales,
    camas_ocupadas: estadoBase.camas_ocupadas,
    camas_disponibles: estadoBase.camas_disponibles,
    personal_activo: estadoBase.personal_activo,
    personal_total: estadoBase.personal_total,
    quirofanos_totales: estadoBase.quirofanos_totales,
    quirofanos_activos: estadoBase.quirofanos_activos,
    tiempo_espera_min: estadoBase.tiempo_espera_min,
    hora_del_dia: estadoBase.hora_del_dia,
    nuevos_pacientes: nuevosPacientes,
    pacientes_atendidos_ciclo: pacientesAtendidosCiclo,
    pacientes_con_cama: pacientesConCama,
    altas_ciclo: altasCiclo,
    timestamp: estadoBase.timestamp
  };
}

function reiniciarSimulacion() {
  estadoActual = { ...estadoInicial };

  return {
    ...construirEstadoBase(new Date())
  };
}

function obtenerEstadoActual() {
  return {
    ...construirEstadoBase(new Date())
  };
}

module.exports = {
  generarEstadoHospitalario,
  reiniciarSimulacion,
  obtenerEstadoActual
};
