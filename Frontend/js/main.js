'use strict';

/* 🔥 IMPORTS */
import {
  buildAreas,
  buildAlerts,
  buildPersonal,
  buildRecoms
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
   🧠 ADAPTADOR IA
============================================================================= */
function adaptarPrediccion(apiData = []) {
  if (!apiData.length) return null;

  const ultima = apiData[0];

  return {
    riesgo: ultima.nivel_riesgo || "medio",
    confianza: Math.round((ultima.probabilidad || 0) * 100),
    ocupacion: ultima.ocupacion_predicha || 0,
    recomendacion: ultima.accion || "Sin acción",
    ingresos: Math.floor(Math.random() * 10) + 5,
    altas: Math.floor(Math.random() * 5) + 2
  };
}

/* =============================================================================
   🌐 FETCH IA
============================================================================= */
async function getPrediccion() {
  try {
    const res = await fetch("http://localhost:5000/api/prediccion");
    const json = await res.json();
    return adaptarPrediccion(json?.data || []);
  } catch (err) {
    console.error("[SOLH] Error IA:", err);
    return null;
  }
}

/* =============================================================================
   🎯 RENDER IA
============================================================================= */
function renderPrediccion(p) {
  const riesgoEl = document.getElementById("ia-riesgo-val");
  const conf = document.getElementById("ia-conf");
  const ocp = document.getElementById("ia-ocp");
  const ing = document.getElementById("ia-ing");
  const alt = document.getElementById("ia-alt");

  // 🔥 fallback si no hay datos
  if (!p) {
    if (riesgoEl) riesgoEl.textContent = "--";
    if (conf) conf.textContent = "--";
    if (ocp) ocp.textContent = "--";
    if (ing) ing.textContent = "--";
    if (alt) alt.textContent = "--";
    return;
  }

  const colorMap = {
    alto: "var(--red)",
    medio: "var(--amber)",
    bajo: "var(--green)"
  };

  if (riesgoEl) {
    riesgoEl.textContent = p.riesgo.toUpperCase();
    riesgoEl.style.color = colorMap[p.riesgo] || "white";
  }

  if (conf) conf.textContent = `Confianza: ${p.confianza}%`;
  if (ocp) ocp.textContent = p.ocupacion + "%";
  if (ing) ing.textContent = "+" + p.ingresos;
  if (alt) alt.textContent = "+" + p.altas;
}

/* =============================================================================
   🚀 CARGA INICIAL
============================================================================= */
async function loadData() {
  try {
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

    init();

    // 🔥 IA inicial aparte
    PRED = await getPrediccion();
    renderPrediccion(PRED);

  } catch (err) {
    console.error('[SOLH] Error backend:', err);
  }
}

/* =============================================================================
   🔄 REFRESH DATOS
============================================================================= */
async function refreshData() {
  try {
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

    renderKPIs();
    buildAreas(DATA);
    buildAlerts(DATA);
    updateChart(DATA);

  } catch (err) {
    console.error('[SOLH] Error refresh:', err);
  }
}

/* =============================================================================
   🔄 REFRESH IA (SEPARADO 🔥)
============================================================================= */
async function refreshIA() {
  PRED = await getPrediccion();
  renderPrediccion(PRED);
}

/* =============================================================================
   📊 KPIs
============================================================================= */
function renderKPIs() {
  document.getElementById("kpi-pac").textContent = DATA.pacientes ?? 0;
  document.getElementById("kpi-camas").textContent = DATA.camas ?? 0;
  document.getElementById("kpi-sat").textContent = (DATA.saturacion ?? 0) + "%";
  document.getElementById("kpi-per").textContent = DATA.personal_total ?? "--";
}

/* =============================================================================
   🧩 MODAL
============================================================================= */
function toggleEspecialistas() {
  const modal = document.getElementById('esp-modal');
  if (modal) modal.classList.toggle('esp-modal--visible');
}

/* =============================================================================
   ⏱ RELOJ
============================================================================= */
function updateTS() {
  const el = document.getElementById('ts');
  if (!el) return;

  el.textContent = new Date().toLocaleTimeString('es-MX', { hour12: false });
}

/* =============================================================================
   🔥 INIT
============================================================================= */
function init() {
  buildAreas(DATA);
  buildAlerts(DATA);
  buildPersonal(DATA, toggleEspecialistas);
  buildRecoms(DATA);

  renderKPIs();
  initChart(DATA);

  updateTS();
  setInterval(updateTS, 1000);

  // 🔥 REFRESH separado (PRO)
  setInterval(refreshData, 5000); // datos
  setInterval(refreshIA, 10000);  // IA
}

/* =============================================================================
   FIX HTML
============================================================================= */
window.toggleEspecialistas = toggleEspecialistas;
window.switchChart = (mode) => switchChart(mode, DATA);
window.selectDay   = (day)  => selectDay(day, DATA);

/* =============================================================================
   START
============================================================================= */
document.addEventListener('DOMContentLoaded', loadData);