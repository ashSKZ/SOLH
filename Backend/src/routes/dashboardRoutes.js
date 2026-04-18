const router = require("express").Router();
const {
  getResumen,
  generarSimulacion,
  getGrafica,
  getAlertas
} = require("../controllers/dashboardController");

router.get("/resumen", getResumen);
router.post("/simular", generarSimulacion);
router.get("/grafica", getGrafica);
router.get("/alertas", getAlertas);
module.exports = router;