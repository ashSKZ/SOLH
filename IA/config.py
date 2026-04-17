"""
SOHL – Configuración global del módulo de IA
"""

import os

# ── Rutas ────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATOS_DIR   = os.path.join(BASE_DIR, "datos")
MODELO_PATH = os.path.join(DATOS_DIR, "modelos", "xgboost_sohl.json")

# ── Backend (API principal del sistema) ───────────────────────────────────────
BACKEND_URL     = os.getenv("BACKEND_URL", "http://localhost:8000")
ENDPOINT_ALERTA = f"{BACKEND_URL}/api/alertas"
ENDPOINT_ESTADO = f"{BACKEND_URL}/api/estado-ia"

# ── Servidor IA ───────────────────────────────────────────────────────────────
IA_HOST = os.getenv("IA_HOST", "0.0.0.0")
IA_PORT = int(os.getenv("IA_PORT", 5050))

# ── Modelo ────────────────────────────────────────────────────────────────────
VENTANA_PREDICCION_MIN = 30       # minutos a futuro que predice el modelo
UMBRAL_RIESGO_MEDIO    = 0.50
UMBRAL_RIESGO_ALTO     = 0.70
UMBRAL_RIESGO_CRITICO  = 0.85

# ── Umbrales de ocupación (%) ──────────────────────────────────────────────────
OCUPACION_NORMAL   = 70
OCUPACION_MEDIA    = 80
OCUPACION_ALTA     = 90
OCUPACION_CRITICA  = 95

# ── Simulación ────────────────────────────────────────────────────────────────
TOTAL_CAMAS        = 200
TOTAL_PERSONAL     = 80
TOTAL_QUIROFANOS   = 10