"""
simulacion/receptor_simulacion.py
Genera o recibe datos del hospital (simulados para hackathon).
En producción este módulo se conectaría al WebSocket / API del simulador.
"""

import random
from datetime import datetime, timezone
from typing import Any, Dict

from config import (
    TOTAL_CAMAS,
    TOTAL_PERSONAL,
    TOTAL_QUIROFANOS,
)
from utilidades import obtener_logger

log = obtener_logger(__name__)


def _hora_del_dia() -> int:
    return datetime.now(timezone.utc).hour


def generar_datos_hospital() -> Dict[str, Any]:
    """
    Simula el estado actual del hospital.
    Retorna un diccionario con métricas crudas en tiempo real.
    """
    hora = _hora_del_dia()

    # Mayor presión en horario pico (8-20 h)
    factor_pico = 1.25 if 8 <= hora <= 20 else 0.80

    camas_ocupadas    = int(random.gauss(TOTAL_CAMAS * 0.75 * factor_pico, 15))
    camas_ocupadas    = max(0, min(camas_ocupadas, TOTAL_CAMAS))

    personal_activo   = int(random.gauss(TOTAL_PERSONAL * 0.85 * factor_pico, 8))
    personal_activo   = max(1, min(personal_activo, TOTAL_PERSONAL))

    quirofanos_activos = random.randint(0, TOTAL_QUIROFANOS)

    pacientes_urgencias  = int(random.gauss(30 * factor_pico, 10))
    pacientes_urgencias  = max(0, pacientes_urgencias)

    tiempo_espera_min    = int(random.gauss(45 * factor_pico, 20))
    tiempo_espera_min    = max(5, tiempo_espera_min)

    ingresos_ultima_hora = random.randint(0, int(15 * factor_pico))
    altas_ultima_hora    = random.randint(0, 12)

    datos = {
        "timestamp":             datetime.now(timezone.utc).isoformat(),
        "camas_totales":         TOTAL_CAMAS,
        "camas_ocupadas":        camas_ocupadas,
        "personal_total":        TOTAL_PERSONAL,
        "personal_activo":       personal_activo,
        "quirofanos_totales":    TOTAL_QUIROFANOS,
        "quirofanos_activos":    quirofanos_activos,
        "pacientes_urgencias":   pacientes_urgencias,
        "tiempo_espera_min":     tiempo_espera_min,
        "ingresos_ultima_hora":  ingresos_ultima_hora,
        "altas_ultima_hora":     altas_ultima_hora,
        "hora_del_dia":          hora,
    }

    log.debug("Datos recibidos del hospital: %s", datos)
    return datos