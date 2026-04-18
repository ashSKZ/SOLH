const router = require("express").Router();

const {
  generarPrediccion,
  getPredicciones
} = require("../controllers/prediccionController");

router.post("/", generarPrediccion);
router.get("/", getPredicciones);

module.exports = router;