"""
procesamiento/clasificador_riesgo.py
Convierte la probabilidad de saturación en nivel de riesgo y acción recomendada.
"""

from typing import Any, Dict

from config import (
    UMBRAL_RIESGO_MEDIO,
    UMBRAL_RIESGO_ALTO,
    UMBRAL_RIESGO_CRITICO,
    OCUPACION_NORMAL,
    OCUPACION_MEDIA,
    OCUPACION_ALTA,
    OCUPACION_CRITICA,
)
from utilidades import obtener_logger

log = obtener_logger(__name__)

ACCIONES = {
    "bajo":    "Monitoreo de rutina. Sin intervención requerida.",
    "medio":   "Activar protocolo preventivo. Revisar altas pendientes.",
    "alto":    "Habilitar camas de expansión. Reforzar personal de turno.",
    "critico": "ALERTA MÁXIMA: Activar plan de contingencia hospitalaria inmediatamente.",
}


def clasificar(probabilidad: float, ocupacion_predicha: float) -> Dict[str, Any]:
    """
    Determina el nivel de riesgo y la acción recomendada.

    Args:
        probabilidad:      Score del modelo (0-1), probabilidad de saturación.
        ocupacion_predicha: Ocupación proyectada en % (0-100).

    Returns:
        Dict con nivel, probabilidad, ocupación predicha y acción.
    """
    if probabilidad >= UMBRAL_RIESGO_CRITICO:
        nivel = "critico"
    elif probabilidad >= UMBRAL_RIESGO_ALTO:
        nivel = "alto"
    elif probabilidad >= UMBRAL_RIESGO_MEDIO:
        nivel = "medio"
    else:
        nivel = "bajo"

    resultado = {
        "nivel_riesgo":       nivel,
        "probabilidad":       round(probabilidad, 4),
        "ocupacion_predicha": round(ocupacion_predicha, 1),
        "accion":             ACCIONES[nivel],
    }

    log.info(
        "Riesgo clasificado → nivel=%s | prob=%.2f | ocupacion=%.1f%%",
        nivel, probabilidad, ocupacion_predicha
    )
    return resultado