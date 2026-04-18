'use strict';

const BASE = "http://localhost:5000/api";

/* =============================================================================
   RESUMEN → ADAPTADO A TU UI
   ============================================================================= */
export async function getResumen() {
  const res = await fetch(`${BASE}/resumen`);
  const json = await res.json();

  const d = json.data;

  // 🔥 evita crash si no hay datos
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

  const pacientes_activos =
    d.pacientes_activos ?? d.camas_ocupadas ?? 0;

  const camas_disponibles = d.camas_disponibles ?? 0;

  const total = pacientes_activos + camas_disponibles || 1;

  const saturacion =
    d.ocupacion_porcentaje ??
    Math.round((pacientes_activos / total) * 100) ??
    0;

  return {
    pacientes: pacientes_activos,
    camas: camas_disponibles,
    saturacion,
    totalCamas: total,

    areas: [
      {
        nombre: d.area || "General",
        pct: saturacion,
        color:
          saturacion > 80
            ? "#ef4444"
            : saturacion > 60
            ? "#f59e0b"
            : "#10b981"
      }
    ],


    recoms: [
      saturacion > 85
        ? "Activar protocolo de emergencia"
        : saturacion > 65
        ? "Alta ocupación, monitorear flujo"
        : "Operación estable"
    ]
  };
}

/* =============================================================================
   🔥 ALERTAS (FIX IMPORTANTE)
   ============================================================================= */
export async function getAlertas() {
  const res = await fetch(`${BASE}/alertas`);
  const json = await res.json();

  const data = json?.data || [];

  return data.map(a => {
    // 🔥 convertir fecha real
    const fecha = a.createdAt ? new Date(a.createdAt) : new Date();

    const hora = fecha.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    });

    return {
      msg: a.mensaje ?? "Alerta",
      
      // 🔥 normalización de niveles
      nivel:
        a.nivel === "critica" || a.nivel === "alto"
          ? "high"
          : a.nivel === "media"
          ? "medium"
          : "low",

      hora // 👈 ahora sí real, no "Ahora"
    };
  });
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
      new Date(d.t).toLocaleTimeString("es-MX", {
        hour12: false
      })
    ),

    historial_dias: [
      {
        data: data.map(d => {
          const pacientes = d.pacientes ?? 0;
          const camas = d.camas ?? 0;
          const total = pacientes + camas || 1;

          return Math.round((pacientes / total) * 100);
        }),

        max: Math.max(...data.map(d => d.pacientes || 0), 0),
        min: Math.min(...data.map(d => d.pacientes || 0), 0),

        prom: data.length
          ? Math.round(
              data.reduce((acc, d) => acc + (d.pacientes || 0), 0) /
                data.length
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