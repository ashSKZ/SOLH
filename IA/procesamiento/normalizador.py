"""
procesamiento/normalizador.py
Normaliza features al rango [0, 1] para XGBoost.
Usa estadísticas fijas definidas en entrenamiento (sin sklearn en producción).
"""

from typing import Dict

from utilidades import obtener_logger

log = obtener_logger(__name__)

# Valores mínimos y máximos observados en entrenamiento
# (ajustar con datos reales cuando se tenga histórico)
ESTADISTICAS = {
    "ocupacion_camas":         {"min": 0.0,  "max": 1.0},
    "ocupacion_personal":      {"min": 0.0,  "max": 1.0},
    "ocupacion_quirofanos":    {"min": 0.0,  "max": 1.0},
    "presion_camas":           {"min": 0.0,  "max": 1.0},
    "ratio_paciente_personal": {"min": 0.0,  "max": 20.0},
    "flujo_neto":              {"min": -20.0,"max": 20.0},
    "indice_urgencias":        {"min": 0.0,  "max": 10.0},
    "tiempo_espera_min":       {"min": 0.0,  "max": 300.0},
    "factor_hora":             {"min": 0.0,  "max": 1.0},
    "pacientes_urgencias":     {"min": 0.0,  "max": 100.0},
}


def _min_max(valor: float, minv: float, maxv: float) -> float:
    if maxv == minv:
        return 0.0
    return max(0.0, min(1.0, (valor - minv) / (maxv - minv)))


def normalizar(features: Dict[str, float]) -> Dict[str, float]:
    """Aplica normalización min-max a cada feature."""
    normalizadas = {}
    for clave, valor in features.items():
        est = ESTADISTICAS.get(clave)
        if est:
            normalizadas[clave] = _min_max(valor, est["min"], est["max"])
        else:
            normalizadas[clave] = valor  # sin normalizar si no está en tabla

    log.debug("Features normalizadas: %s", normalizadas)
    return normalizadas