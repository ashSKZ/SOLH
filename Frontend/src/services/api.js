const BASE = "http://localhost:5000/api";

async function request(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error en API");
    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    return null;
  }
}

export const getResumen = () => request(`${BASE}/resumen`);
export const getGrafica = () => request(`${BASE}/grafica`);
export const getPredicciones = () => request(`${BASE}/prediccion`);
export const getAlertas = () => request(`${BASE}/alertas`);