const express = require("express");
const {
  recibirSimulacion,
  obtenerLatest,
  obtenerHistorialSnapshots
} = require("../controllers/ingestaController");

const router = express.Router();

router.post("/simulacion", recibirSimulacion);
router.get("/latest", obtenerLatest);
router.get("/historial", obtenerHistorialSnapshots);

module.exports = router;
