const historialEstados = [];
let ultimoEstado = null;
const MAX_HISTORIAL = 100;

function guardarSnapshot(snapshot) {
  ultimoEstado = snapshot;
  historialEstados.push(snapshot);

  if (historialEstados.length > MAX_HISTORIAL) {
    historialEstados.shift();
  }

  return ultimoEstado;
}

function obtenerUltimoEstado() {
  return ultimoEstado;
}

function obtenerHistorial(limit) {
  if (!Number.isInteger(limit) || limit <= 0) {
    return [...historialEstados];
  }

  return historialEstados.slice(-limit);
}

function obtenerTotalHistorial() {
  return historialEstados.length;
}

module.exports = {
  guardarSnapshot,
  obtenerUltimoEstado,
  obtenerHistorial,
  obtenerTotalHistorial
};
