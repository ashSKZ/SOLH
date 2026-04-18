'use strict';

/* 🔥 IMPORTS */
import {
  buildAreas,
  buildAlerts,
  buildPersonal,
  buildRecoms,
  buildPersonalCapital,
  buildMaterialCapital
} from "./ui/ui.js";

import {
  initChart,
  switchChart,
  selectDay,
  updateChart
} from "./charts/chart.js";

import {
  getResumen,
  getGrafica,
  getAlertas
} from "./services/api.js";

/* ── ESTADO GLOBAL ── */
let DATA = {};
let PRED = null;

/* =============================================================================
   🔍 DETECTAR INVENTARIO
============================================================================= */
function isInventarioPage() {
  const page = document.getElementById("page-inventario");
  return page && page.classList.contains("active");
}

/* =============================================================================
   🧠 IA
============================================================================= */
function adaptarPrediccion(apiData = []) {
  if (!apiData.length) return null;

  const ultima = apiData[0];

  // ✅ FIX: usar ?? en lugar de || para que 0 sea un valor válido,
  //         y loguear lo que llega del API para diagnóstico
  console.log("[IA] datos crudos del API:", ultima);

  const confianza = ultima.probabilidad != null
    ? Math.round(ultima.probabilidad * 100)
    : null;

  const ocupacion = ultima.ocupacion_predicha ?? null;

  console.log("[IA] confianza calculada:", confianza, "| ocupacion:", ocupacion);

  return {
    riesgo:    ultima.nivel_riesgo   ?? "medio",
    confianza: confianza             ?? 0,
    ocupacion: ocupacion             ?? 0,
    ingresos:  Math.floor(Math.random() * 10) + 5,
    altas:     Math.floor(Math.random() * 5)  + 2
  };
}

async function getPrediccion() {
  try {
    const res  = await fetch("http://localhost:5000/api/prediccion");
    const json = await res.json();

    // ✅ Log para ver la respuesta completa del API
    console.log("[IA] respuesta completa del API:", json);

    return adaptarPrediccion(json?.data || []);
  } catch (err) {
    console.warn("[IA] error al obtener prediccion:", err);
    return null;
  }
}

function renderPrediccion(p) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  if (!p) {
    ["ia-riesgo-val", "ia-conf", "ia-ocp", "ia-ing", "ia-alt"]
      .forEach(id => set(id, "--"));
    return;
  }

  // ✅ FIX: colorear el nivel de riesgo según valor
  const riesgoEl = document.getElementById("ia-riesgo-val");
  if (riesgoEl) {
    riesgoEl.textContent = p.riesgo.toUpperCase();
    riesgoEl.className = `ia-val-${p.riesgo.toLowerCase()}`;
  }

  set("ia-conf", `${p.confianza}%`);
  set("ia-ocp",  `${p.ocupacion}%`);
  set("ia-ing",  "+" + p.ingresos);
  set("ia-alt",  "+" + p.altas);
}

/* =============================================================================
   📡 CAPITAL
============================================================================= */
async function getCapitalResumen() {
  try {
    const res  = await fetch("http://localhost:5000/api/capital/resumen");
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

async function loadInventario() {
  const data = await getCapitalResumen();
  if (!data) return;

  DATA.personal_total = data.total_personal;
  if (data.total_camas) DATA.camas = data.total_camas;

  buildPersonalCapital(data);
  buildMaterialCapital(data);

  renderKPIs();
}

/* =============================================================================
   🚀 LOAD INICIAL
============================================================================= */
async function loadData() {
  const [resumen, grafica, alertas] = await Promise.all([
    getResumen(),
    getGrafica(),
    getAlertas()
  ]);

  DATA = {
    ...(resumen || {}),
    ...(grafica || {}),
    alerts: alertas || []
  };

  // ✅ FIX: obtener personal_total desde capital para que el KPI arranque con dato
  const capital = await getCapitalResumen();
  if (capital?.total_personal != null) {
    DATA.personal_total = capital.total_personal;
  }

  init();

  PRED = await getPrediccion();
  renderPrediccion(PRED);

  if (isInventarioPage()) {
    loadInventario();
  }
}

/* =============================================================================
   IDENTIFICACION: EXTRACTOR INE
============================================================================= */
function initIdentificacionExtractor() {
  const form = document.getElementById("id-form-extraccion");
  const inputImagen = document.getElementById("id-imagen-ine");
  const preview = document.getElementById("id-preview");
  const previewPlaceholder = document.getElementById("id-preview-placeholder");
  const btnProcesar = document.getElementById("id-btn-procesar");
  const estadoGuardado = document.getElementById("id-estado-guardado");
  const mensaje = document.getElementById("id-mensaje");

  if (!form || !inputImagen || !preview || !previewPlaceholder || !btnProcesar || !estadoGuardado || !mensaje) {
    return;
  }

  const campos = {
    nombre: document.getElementById("id-nombre"),
    apellido_paterno: document.getElementById("id-apellido-paterno"),
    apellido_materno: document.getElementById("id-apellido-materno"),
    curp: document.getElementById("id-curp"),
    fecha_nacimiento: document.getElementById("id-fecha-nac"),
    sexo: document.getElementById("id-sexo")
  };

  const API_URL = "http://localhost:8000/extractor/procesar";

  function actualizarCampos(datos = {}) {
    Object.entries(campos).forEach(([clave, element]) => {
      if (!element) return;
      element.textContent = datos[clave] || "-";
    });
  }

  function pintarEstado(texto, clase, detalle = "") {
    estadoGuardado.textContent = texto;
    estadoGuardado.className = `id-estado ${clase}`;
    mensaje.textContent = detalle;
  }

  inputImagen.addEventListener("change", () => {
    const archivo = inputImagen.files?.[0];
    if (!archivo) return;
    const blobUrl = URL.createObjectURL(archivo);
    preview.src = blobUrl;
    preview.style.display = "block";
    previewPlaceholder.style.display = "none";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const archivo = inputImagen.files?.[0];
    if (!archivo) {
      pintarEstado("Selecciona una imagen", "id-estado-error", "No se encontro archivo para procesar.");
      return;
    }

    btnProcesar.disabled = true;
    btnProcesar.textContent = "Procesando...";
    pintarEstado("Procesando con Gemini", "id-estado-neutro", "Extrayendo datos y guardando en check_in_maestro.xlsx");

    try {
      const body = new FormData();
      body.append("imagen", archivo);

      const response = await fetch(API_URL, { method: "POST", body });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "No se pudo procesar la INE.");
      }

      actualizarCampos(result.datos || {});

      if (result.guardado_xlsx) {
        pintarEstado(
          "Guardado correctamente",
          "id-estado-ok",
          result.mensaje || "Registro almacenado en check_in_maestro.xlsx"
        );
      } else {
        pintarEstado(
          "No se guardo en XLSX",
          "id-estado-error",
          result.mensaje || "Se extrajeron datos, pero no se confirmo guardado."
        );
      }
    } catch (error) {
      actualizarCampos({});
      pintarEstado("Error de procesamiento", "id-estado-error", error.message);
    } finally {
      btnProcesar.disabled = false;
      btnProcesar.textContent = "Procesar con Gemini";
    }
  });
}

/* =============================================================================
   🔄 REFRESH (cada 5 segundos)
============================================================================= */
async function refreshData() {
  const [resumen, grafica, alertas] = await Promise.all([
    getResumen(),
    getGrafica(),
    getAlertas()
  ]);

  DATA = {
    ...(resumen || {}),
    ...(grafica || {}),
    alerts: alertas || []
  };

  // ✅ FIX: refrescar personal_total desde capital para mantener el KPI actualizado
  const capital = await getCapitalResumen();
  if (capital?.total_personal != null) {
    DATA.personal_total = capital.total_personal;
  }

  renderKPIs();

  buildAreas(DATA);
  buildAlerts(DATA);
  buildPersonal(DATA, toggleEspecialistas);
  buildRecoms(DATA);
  updateChart(DATA);

  if (isInventarioPage()) {
    loadInventario();
  }
}

/* =============================================================================
   🔄 REFRESH IA (cada 10 segundos)
============================================================================= */
async function refreshIA() {
  PRED = await getPrediccion();
  renderPrediccion(PRED);
}

/* =============================================================================
   📊 KPIs
============================================================================= */
function renderKPIs() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("kpi-pac",   DATA.pacientes      ?? 0);
  set("kpi-camas", DATA.camas          ?? 0);
  set("kpi-sat",   (DATA.saturacion    ?? 0) + "%");
  set("kpi-per",   DATA.personal_total ?? "--");
}

/* =============================================================================
   UTIL
============================================================================= */
function toggleEspecialistas() {
  const modal = document.getElementById('esp-modal');
  if (modal) modal.classList.toggle('esp-modal--visible');
}

function updateTS() {
  const el = document.getElementById('ts');
  if (el) {
    el.textContent = new Date().toLocaleTimeString('es-MX', { hour12: false });
  }
}

/* =============================================================================
   INIT
============================================================================= */
function init() {
  buildAreas(DATA);
  buildAlerts(DATA);
  buildPersonal(DATA, toggleEspecialistas);
  buildRecoms(DATA);

  renderKPIs();
  initChart(DATA);

  updateTS();
  setInterval(updateTS,    1000);
  setInterval(refreshData, 5000);
  setInterval(refreshIA,  10000);
}

/* =============================================================================
   ✅ FIX: escuchar el evento de navegación al inventario
============================================================================= */
window.addEventListener('loadInventario', loadInventario);

/* =============================================================================
   EXPONER FUNCIONES GLOBALES AL HTML
============================================================================= */
window.toggleEspecialistas = toggleEspecialistas;
window.switchChart = (mode) => switchChart(mode, DATA);
window.selectDay   = (day)  => selectDay(day, DATA);

/* =============================================================================
   START
============================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initIdentificacionExtractor();
  loadData();
});