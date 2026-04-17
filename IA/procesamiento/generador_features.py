"""
procesamiento/generador_features.py
Convierte datos limpios en variables (features) significativas para XGBoost.
"""

from typing import Any, Dict

from utilidades import obtener_logger

log = obtener_logger(__name__)


def generar_features(datos: Dict[str, Any]) -> Dict[str, float]:
    """
    Genera variables derivadas que capturan la presión real del hospital.
    Retorna un dict con todas las features listas para el modelo.
    """
    camas_t   = datos["camas_totales"]
    personal_t = datos["personal_total"]
    quir_t    = datos["quirofanos_totales"]

    # ── Ratios de ocupación ────────────────────────────────────────────────────
    ocupacion_camas      = datos["camas_ocupadas"] / camas_t
    ocupacion_personal   = datos["personal_activo"] / personal_t
    ocupacion_quirofanos = datos["quirofanos_activos"] / max(quir_t, 1)

    # ── Presión de camas (cuántas camas libres quedan realmente) ───────────────
    camas_libres         = camas_t - datos["camas_ocupadas"]
    presion_camas        = 1 - (camas_libres / camas_t)

    # ── Ratio paciente/personal: mide carga del personal ──────────────────────
    ratio_paciente_personal = (
        datos["camas_ocupadas"] / max(datos["personal_activo"], 1)
    )

    # ── Flujo neto: indica si el hospital se está llenando o vaciando ─────────
    flujo_neto = datos["ingresos_ultima_hora"] - datos["altas_ultima_hora"]

    # ── Índice de urgencias: urgencias normalizadas por camas libres ───────────
    indice_urgencias = datos["pacientes_urgencias"] / max(camas_libres, 1)

    # ── Factor hora: pico = 1, madrugada = 0 ──────────────────────────────────
    hora = datos["hora_del_dia"]
    if 8 <= hora <= 20:
        factor_hora = 1.0
    elif 6 <= hora < 8 or 20 < hora <= 22:
        factor_hora = 0.6
    else:
        factor_hora = 0.3

    features = {
        "ocupacion_camas":         round(ocupacion_camas, 4),
        "ocupacion_personal":      round(ocupacion_personal, 4),
        "ocupacion_quirofanos":    round(ocupacion_quirofanos, 4),
        "presion_camas":           round(presion_camas, 4),
        "ratio_paciente_personal": round(ratio_paciente_personal, 4),
        "flujo_neto":              float(flujo_neto),
        "indice_urgencias":        round(indice_urgencias, 4),
        "tiempo_espera_min":       float(datos["tiempo_espera_min"]),
        "factor_hora":             factor_hora,
        "pacientes_urgencias":     float(datos["pacientes_urgencias"]),
    }

    log.debug("Features generadas: %s", features)
    return features