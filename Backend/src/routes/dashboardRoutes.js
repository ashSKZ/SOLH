const router = require("express").Router();
const {
  getResumen,
  generarSimulacion,
  getGrafica
} = require("../controllers/dashboardController");

router.get("/resumen", getResumen);
router.post("/simular", generarSimulacion);
router.get("/grafica", getGrafica);

module.exports = router;