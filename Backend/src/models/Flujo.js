const mongoose = require("mongoose");

const FlujoSchema = new mongoose.Schema({
  pacientes_espera: Number,
  pacientes_atendidos: Number,
  camas_disponibles: Number,
  camas_ocupadas: Number,
  nivel: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Flujo", FlujoSchema);