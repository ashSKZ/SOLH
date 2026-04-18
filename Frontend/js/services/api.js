// js/services/api.js

const BASE = "http://localhost:5000/api";

/* =============================================================================
   RESUMEN → ADAPTADO A TU UI
   ============================================================================= */
export async function getResumen() {
  const res = await fetch(`${BASE}/resumen`);
  const json = await res.json();

  const d = json.data;

  // 🔥 si no hay datos en DB evita crash
  if (!d) {
    return {
      pacientes: 0,
      camas: 0,
      saturacion: 0,
      totalCamas: 1,
      areas: [],
      personal_detalle: [],
      recoms: ["Sin datos"]
    };
  }

  const camas_ocupadas = d.camas_ocupadas ?? 0;
  const camas_disponibles = d.camas_disponibles ?? 0;
  const total = camas_ocupadas + camas_disponibles || 1;

  const saturacion = Math.round((camas_ocupadas / total) * 100) || 0;

  return {
    pacientes: d.pacientes_espera ?? 0,
    camas: camas_disponibles,
    saturacion,

    totalCamas: total,

    areas: [
      {
        nombre: d.area || "General",
        pct: saturacion,
        color: saturacion > 80
          ? "#ef4444"
          : saturacion > 60
          ? "#f59e0b"
          : "#10b981"
      }
    ],

    personal_detalle: [
      { icon: "👨‍⚕️", val: 10, label: "Médicos" },
      { icon: "👩‍⚕️", val: 14, label: "Enfermeros" }
    ],

    recoms: [
      saturacion > 80
        ? "Activar protocolo de emergencia"
        : "Operación estable"
    ]
  };
}

/* =============================================================================
   ALERTAS
   ============================================================================= */
export async function getAlertas() {
  const res = await fetch(`${BASE}/alertas`);
  const json = await res.json();

  if (!json.data) return [];

  return json.data.map(a => ({
    msg: a.mensaje,
    nivel: a.nivel === "alto" ? "high" : "medium",
    hora: "Ahora"
  }));
}

/* =============================================================================
   GRÁFICA
   ============================================================================= */
export async function getGrafica() {
  const res = await fetch(`${BASE}/grafica`);
  const json = await res.json();

  const data = json.data || [];

  return {
    labels_12h: data.map(d =>
      new Date(d.t).toLocaleTimeString('es-MX', { hour12: false })
    ),

    historial_dias: [
      {
        data: data.map(d => {
          const total = (d.pacientes ?? 0) + (d.camas ?? 0) || 1;
          return Math.round(((d.pacientes ?? 0) / total) * 100);
        }),
        max: Math.max(...data.map(d => d.pacientes || 0), 0),
        min: Math.min(...data.map(d => d.pacientes || 0), 0),
        prom: data.length
          ? Math.round(
              data.reduce((acc, d) => acc + (d.pacientes || 0), 0) / data.length
            )
          : 0,
        label: "Hoy"
      }
    ]
  };
}

/* =============================================================================
   SIMULACIÓN
   ============================================================================= */
export async function simular(payload) {
  const res = await fetch(`${BASE}/simular`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error("Error en simulación");
  }

  return res.json();
}