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
  updateChart // 🔥 NUEVO
} from "./charts/chart.js";

/* 🔥 API */
import {
  getResumen,
  getGrafica,
  getAlertas
} from "./services/api.js";

/* ── Estado global ── */
let DATA = {};

/* =============================================================================
   CARGA INICIAL
   ============================================================================= */
async function loadData() {
  try {
    const resumen = await getResumen();
    const grafica = await getGrafica();
    const alertas = await getAlertas();

    DATA = {
      ...resumen,
      ...grafica,
      alerts: alertas
    };

    init();

  } catch (err) {
    console.error('[SOLH] Error backend:', err);
  }
}

/* =============================================================================
   🔥 REFRESH EN TIEMPO REAL
   ============================================================================= */
async function refreshData() {
  try {
    const resumen = await getResumen();
    const grafica = await getGrafica();
    const alertas = await getAlertas();

    DATA = {
      ...resumen,
      ...grafica,
      alerts: alertas
    };

    /* UI */
    renderKPIs();
    buildAreas(DATA);
    buildAlerts(DATA);

    /* 🔥 ACTUALIZA GRÁFICA */
    updateChart(DATA);

  } catch (err) {
    console.error('[SOLH] Error refresh:', err);
  }
}

/* =============================================================================
   KPIs
   ============================================================================= */
function renderKPIs() {
  document.getElementById("kpi-pac").textContent =
    DATA.pacientes ?? 0;

  document.getElementById("kpi-camas").textContent =
    DATA.camas ?? 0;

  document.getElementById("kpi-sat").textContent =
    (DATA.saturacion ?? 0) + "%";
}

/* =============================================================================
   MODAL
   ============================================================================= */
function toggleEspecialistas() {
  const modal = document.getElementById('esp-modal');
  if (modal) modal.classList.toggle('esp-modal--visible');
}

/* =============================================================================
   RELOJ
   ============================================================================= */
function updateTS() {
  const now = new Date();
  const el  = document.getElementById('ts');
  if (el) {
    el.textContent = now.toLocaleTimeString('es-MX', { hour12: false });
  }
}

/* =============================================================================
   INIT
   ============================================================================= */
function init() {
  /* UI */
  buildAreas(DATA);
  buildAlerts(DATA);
  buildPersonal(DATA);
  buildRecoms(DATA);

  renderKPIs();

  /* CHART (solo una vez) */
  initChart(DATA);

  /* RELOJ */
  updateTS();
  setInterval(updateTS, 1000);

  /* 🔥 TIEMPO REAL */
  setInterval(refreshData, 5000); // cada 5s
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