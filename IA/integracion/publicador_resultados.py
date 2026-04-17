"""
integracion/publicador_resultados.py
Construye el payload final que se envía al backend.
"""

from typing import Any, Dict

from config import VENTANA_PREDICCION_MIN
from utilidades import ahora_iso


def construir_payload(
    datos_hospital: Dict[str, Any],
    clasificacion: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Arma el JSON completo que el backend espera.

    Args:
        datos_hospital: Datos limpios del hospital.
        clasificacion:  Resultado del clasificador de riesgo.

    Returns:
        Payload listo para enviar.
    """
    return {
        "timestamp":             ahora_iso(),
        "ventana_prediccion_min": VENTANA_PREDICCION_MIN,
        "estado_actual": {
            "camas_ocupadas":     datos_hospital["camas_ocupadas"],
            "camas_totales":      datos_hospital["camas_totales"],
            "personal_activo":    datos_hospital["personal_activo"],
            "quirofanos_activos": datos_hospital["quirofanos_activos"],
            "pacientes_urgencias": datos_hospital["pacientes_urgencias"],
            "tiempo_espera_min":  datos_hospital["tiempo_espera_min"],
        },
        "prediccion": {
            "nivel_riesgo":       clasificacion["nivel_riesgo"],
            "probabilidad":       clasificacion["probabilidad"],
            "ocupacion_predicha": clasificacion["ocupacion_predicha"],
            "accion":             clasificacion["accion"],
        },
        "fuente": "SOHL-IA v1.0",
    }