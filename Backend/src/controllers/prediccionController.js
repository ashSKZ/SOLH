const Prediccion = require("../models/Prediccion");
const { calcularPrediccion } = require("../services/iaService");

const generarPrediccion = async (req, res) => {
  try {
    const data = req.body;

    const resultadoIA = calcularPrediccion(data);

    // simulamos ocupación futura (puedes mejorar luego)
    const ocupacion_predicha = Math.min(
      100,
      (resultadoIA.probabilidad * 100) + 20
    );

    const nueva = await Prediccion.create({
      nivel_riesgo: resultadoIA.nivel_ia,
      probabilidad: resultadoIA.probabilidad,
      ocupacion_predicha,
      accion: resultadoIA.accion
    });

    res.json(nueva);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en prediccion" });
  }
};

const getPredicciones = async (req, res) => {
  const datos = await Prediccion.find()
    .sort({ createdAt: -1 })
    .limit(10);

  res.json(datos);
};

module.exports = {
  generarPrediccion,
  getPredicciones
};