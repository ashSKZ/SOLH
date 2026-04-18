const router = require("express").Router();

const {
  crearCapital,
  getCapitalActual,
  getHistorialCapital,
  getResumenCapital
} = require("../controllers/capitalController");

router.post("/", crearCapital);
router.get("/actual", getCapitalActual);
router.get("/historial", getHistorialCapital);
router.get("/resumen", getResumenCapital);

module.exports = router;