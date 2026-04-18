const mongoose = require("mongoose");

const prediccionSchema = new mongoose.Schema({
  nivel_riesgo: String,
  probabilidad: Number,
  ocupacion_predicha: Number,
  accion: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Prediccion", prediccionSchema);