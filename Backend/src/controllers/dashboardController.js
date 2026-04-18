const Flujo = require("../models/Flujo");

const getResumen = async (req, res) => {
  const ultimo = await Flujo.findOne().sort({ createdAt: -1 });

  res.json(ultimo);
};

const generarSimulacion = async (req, res) => {

  const pacientes = Math.floor(Math.random() * 50);
  const camas = Math.floor(Math.random() * 20);

  let nivel = "bajo";

  if (pacientes > 35 || camas <= 5) nivel = "alto";
  else if (pacientes > 20 || camas <= 10) nivel = "medio";

  const nuevo = await Flujo.create({
    pacientes_espera: pacientes,
    pacientes_atendidos: Math.floor(Math.random() * 100),
    camas_disponibles: camas,
    camas_ocupadas: 50 - camas,
    nivel
  });

  res.json(nuevo);
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