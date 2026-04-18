const { calcularPrediccion } = require("../services/iaService");
const Flujo = require("../models/Flujo");

const getResumen = async (req, res) => {
  const ultimo = await Flujo.findOne().sort({ createdAt: -1 });

  res.json(ultimo);
};

const generarSimulacion = async (req, res) => {
  try {
    const data = req.body;

    const pacientes = data.pacientes_espera || 0;
    const camas = data.camas_disponibles ?? (data.camas_totales - data.camas_ocupadas);

    let nivel = "bajo";
    if (pacientes > 35 || camas <= 5) nivel = "alto";
    else if (pacientes > 20 || camas <= 10) nivel = "medio";
    const prediccion = calcularPrediccion(data);

    const nuevo = await Flujo.create({
      area: data.area,
      pacientes_espera: pacientes,
      pacientes_atendidos: data.pacientes_atendidos,
      camas_disponibles: camas,
      camas_ocupadas: data.camas_ocupadas,
      nivel, // nivel básico
      nivel_ia: prediccion.nivel_ia,
      probabilidad: prediccion.probabilidad
    });

    res.json({
      ...nuevo.toObject(),
      prediccion
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error IA/backend" });
  }
};

const getGrafica = async (req, res) => {
  const datos = await Flujo.find()
    .sort({ createdAt: -1 })
    .limit(10);

  res.json(datos.reverse());
};

module.exports = {
  getResumen,
  generarSimulacion,
  getGrafica
};