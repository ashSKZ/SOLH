const Capital = require("../models/Capital");
const Flujo = require("../models/Flujo");

const obtenerNumero = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : 0;
};

const calcularEstadoCamas = (camasDisponibles, porcentajeOcupacion) => {
  if (camasDisponibles <= 5 || porcentajeOcupacion >= 90) return "critico";
  if (camasDisponibles <= 10 || porcentajeOcupacion >= 75) return "preventivo";
  return "estable";
};

const calcularEstadoPersonal = (totalPersonal) => {
  if (totalPersonal <= 5) return "critico";
  if (totalPersonal <= 10) return "limitado";
  return "suficiente";
};

const obtenerResumenOperativo = async () => {
  return Flujo.findOne().sort({ createdAt: -1 });
};

const calcularCamasDesdeResumen = (capital, resumenOperativo) => {
  const camasTotales = obtenerNumero(capital?.material?.camas?.totales);
  const camasOcupadas = obtenerNumero(resumenOperativo?.camas_ocupadas);

  const camasDisponiblesResumen = resumenOperativo?.camas_disponibles;

  const camasDisponibles =
    camasDisponiblesResumen !== undefined && camasDisponiblesResumen !== null
      ? obtenerNumero(camasDisponiblesResumen)
      : Math.max(camasTotales - camasOcupadas, 0);

  const porcentajeOcupacionCamas =
    camasTotales === 0
      ? 0
      : Number(((camasOcupadas / camasTotales) * 100).toFixed(2));

  return {
    totales: camasTotales,
    ocupadas: camasOcupadas,
    disponibles: camasDisponibles,
    porcentaje_ocupacion_camas: porcentajeOcupacionCamas,
    estado_camas: calcularEstadoCamas(camasDisponibles, porcentajeOcupacionCamas),
    fuente_ocupadas: "/api/resumen"
  };
};

const normalizarCapital = (data) => {
  const enfermeria = obtenerNumero(data?.humano?.enfermeria);
  const doctoresGenerales = obtenerNumero(data?.humano?.doctores?.generales);
  const doctoresEspecialistas = obtenerNumero(data?.humano?.doctores?.especialistas);
  const camasTotales = obtenerNumero(data?.material?.camas?.totales);

  const totalDoctores = doctoresGenerales + doctoresEspecialistas;
  const totalPersonal = enfermeria + totalDoctores;

  return {
    area: data.area || "general",
    humano: {
      enfermeria,
      doctores: {
        generales: doctoresGenerales,
        especialistas: doctoresEspecialistas
      }
    },
    material: {
      camas: {
        totales: camasTotales
      }
    },
    totales: {
      total_personal: totalPersonal,
      total_doctores: totalDoctores
    },
    indicadores: {
      estado_personal: calcularEstadoPersonal(totalPersonal)
    }
  };
};

const formatearCapital = (capital, resumenOperativo) => {
  if (!capital) return null;

  const camas = calcularCamasDesdeResumen(capital, resumenOperativo);

  return {
    _id: capital._id,
    area: capital.area,
    humano: capital.humano,
    material: {
      camas: {
        totales: camas.totales,
        ocupadas: camas.ocupadas,
        disponibles: camas.disponibles
      }
    },
    totales: capital.totales,
    indicadores: {
      estado_personal: capital.indicadores.estado_personal,
      porcentaje_ocupacion_camas: camas.porcentaje_ocupacion_camas,
      estado_camas: camas.estado_camas
    },
    fuente: {
      camas_ocupadas: camas.fuente_ocupadas
    },
    createdAt: capital.createdAt
  };
};

const crearCapital = async (req, res) => {
  try {
    const capitalNormalizado = normalizarCapital(req.body);
    const nuevoCapital = await Capital.create(capitalNormalizado);
    const resumenOperativo = await obtenerResumenOperativo();

    res.status(201).json({
      success: true,
      data: formatearCapital(nuevoCapital, resumenOperativo)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar capital" });
  }
};

const getCapitalActual = async (req, res) => {
  try {
    const capital = await Capital.findOne().sort({ createdAt: -1 });
    const resumenOperativo = await obtenerResumenOperativo();

    res.json({
      success: true,
      data: formatearCapital(capital, resumenOperativo)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener capital actual" });
  }
};

const getHistorialCapital = async (req, res) => {
  try {
    const limite = Number(req.query.limit) || 20;
    const resumenOperativo = await obtenerResumenOperativo();

    const datos = await Capital.find()
      .sort({ createdAt: -1 })
      .limit(limite);

    res.json({
      success: true,
      total: datos.length,
      data: datos.map((capital) => formatearCapital(capital, resumenOperativo))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener historial de capital" });
  }
};

const getResumenCapital = async (req, res) => {
  try {
    const ultimo = await Capital.findOne().sort({ createdAt: -1 });
    const resumenOperativo = await obtenerResumenOperativo();

    if (!ultimo) {
      return res.json({
        success: true,
        data: {
          total_personal: 0,
          total_doctores: 0,
          enfermeria: 0,
          camas_totales: 0,
          camas_ocupadas: obtenerNumero(resumenOperativo?.camas_ocupadas),
          camas_disponibles: obtenerNumero(resumenOperativo?.camas_disponibles),
          porcentaje_ocupacion_camas: 0,
          estado_camas: "sin datos",
          estado_personal: "sin datos",
          fuente: {
            camas_ocupadas: "/api/resumen"
          }
        }
      });
    }

    const camas = calcularCamasDesdeResumen(ultimo, resumenOperativo);

    res.json({
      success: true,
      data: {
        area: ultimo.area,
        total_personal: ultimo.totales.total_personal,
        total_doctores: ultimo.totales.total_doctores,
        enfermeria: ultimo.humano.enfermeria,
        doctores_generales: ultimo.humano.doctores.generales,
        doctores_especialistas: ultimo.humano.doctores.especialistas,
        camas_totales: camas.totales,
        camas_ocupadas: camas.ocupadas,
        camas_disponibles: camas.disponibles,
        porcentaje_ocupacion_camas: camas.porcentaje_ocupacion_camas,
        estado_camas: camas.estado_camas,
        estado_personal: ultimo.indicadores.estado_personal,
        fuente: {
          camas_ocupadas: camas.fuente_ocupadas
        },
        fecha: ultimo.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener resumen de capital" });
  }
};

module.exports = {
  crearCapital,
  getCapitalActual,
  getHistorialCapital,
  getResumenCapital
};