const estadoInicial = require("../config/estadoInicial");
const { numeroAleatorio } = require("../utils/random");

let estadoActual = { ...estadoInicial };

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

  return {
    area: estadoActual.area,
    pacientes_espera: estadoActual.pacientes_espera,
    pacientes_atendidos: estadoActual.pacientes_atendidos,
    camas_totales: estadoActual.camas_totales,
    camas_ocupadas: estadoActual.camas_ocupadas,
    camas_disponibles: estadoActual.camas_disponibles,
    personal_activo: estadoActual.personal_activo,
    nuevos_pacientes: nuevosPacientes,
    pacientes_atendidos_ciclo: pacientesAtendidosCiclo,
    pacientes_con_cama: pacientesConCama,
    altas_ciclo: altasCiclo,
    timestamp: new Date().toISOString()
  };
}

function reiniciarSimulacion() {
  estadoActual = { ...estadoInicial };

  return {
    ...estadoActual,
    timestamp: new Date().toISOString()
  };
}

function obtenerEstadoActual() {
  return {
    ...estadoActual,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  generarEstadoHospitalario,
  reiniciarSimulacion,
  obtenerEstadoActual
};
