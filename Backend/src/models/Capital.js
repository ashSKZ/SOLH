const mongoose = require("mongoose");

const CapitalSchema = new mongoose.Schema({
  area: {
    type: String,
    default: "general",
    trim: true
  },
  humano: {
    enfermeria: {
      type: Number,
      default: 0,
      min: 0
    },
    doctores: {
      generales: {
        type: Number,
        default: 0,
        min: 0
      },
      especialistas: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  material: {
    camas: {
      // Aquí SOLO guardamos camas totales.
      // Las ocupadas salen de /api/resumen.
      totales: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  totales: {
    total_personal: {
      type: Number,
      default: 0
    },
    total_doctores: {
      type: Number,
      default: 0
    }
  },
  indicadores: {
    estado_personal: {
      type: String,
      enum: ["suficiente", "limitado", "critico"],
      default: "suficiente"
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Capital", CapitalSchema);