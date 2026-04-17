const {
  guardarSnapshot,
  obtenerUltimoEstado,
  obtenerHistorial,
  obtenerTotalHistorial
} = require("../services/ingestaStore");

function recibirSimulacion(req, res) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe enviarse un snapshot en el body"
    });
  }

  const ultimoEstado = guardarSnapshot(req.body);

  return res.json({
    ok: true,
    mensaje: "Snapshot recibido correctamente",
    data: ultimoEstado
  });
}

function obtenerLatest(req, res) {
  const ultimoEstado = obtenerUltimoEstado();

  if (!ultimoEstado) {
    return res.json({
      ok: false,
      mensaje: "No hay snapshots disponibles"
    });
  }

  return res.json({
    ok: true,
    data: ultimoEstado
  });
}

function obtenerHistorialSnapshots(req, res) {
  const limitRaw = Number.parseInt(req.query.limit, 10);
  const limit = Number.isNaN(limitRaw) ? null : limitRaw;

  const data = obtenerHistorial(limit);

  return res.json({
    ok: true,
    total: obtenerTotalHistorial(),
    data
  });
}

module.exports = {
  recibirSimulacion,
  obtenerLatest,
  obtenerHistorialSnapshots
};
