"""
simulacion/transformador_entrada.py
Mapea el formato real de la simulación al formato interno del módulo de IA.
 
Formato que recibe de la simulación:
{
    "area":                    "admision",
    "pacientes_espera":        62,
    "pacientes_atendidos":     91,
    "camas_totales":           50,
    "camas_ocupadas":          42,
    "camas_disponibles":       8,
    "personal_activo":         5,
    "nuevos_pacientes":        25,
    "pacientes_atendidos_ciclo": 7,
    "pacientes_con_cama":      2,
    "altas_ciclo":             5,
    "timestamp":               "2026-04-17T21:51:06.049Z"
}
"""
 
from datetime import datetime, timezone
from typing import Any, Dict
 
from config import TOTAL_PERSONAL, TOTAL_QUIROFANOS
from utilidades import obtener_logger
 
log = obtener_logger(__name__)
 
# Campos obligatorios que debe mandar la simulación
CAMPOS_REQUERIDOS = [
    "camas_totales",
    "camas_ocupadas",
    "personal_activo",
    "pacientes_espera",
    "nuevos_pacientes",
    "altas_ciclo",
]
 
 
def _extraer_hora(timestamp: str) -> int:
    """Extrae la hora del día desde el timestamp ISO 8601."""
    try:
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        return dt.hour
    except Exception:
        return datetime.now(timezone.utc).hour
 
 
def _estimar_tiempo_espera(pacientes_espera: int, personal_activo: int) -> float:
    """
    Estima el tiempo de espera en minutos basado en
    cuántos pacientes hay por cada trabajador activo.
    """
    if personal_activo == 0:
        return 120.0
    ratio = pacientes_espera / personal_activo
    # Aprox: 10 min base + 5 min por cada paciente por trabajador
    return round(10.0 + ratio * 5.0, 1)
 
 
def transformar(datos_simulacion: Dict[str, Any]) -> Dict[str, Any]:
    """
    Valida y mapea el formato de la simulación al formato interno del módulo IA.
 
    Args:
        datos_simulacion: JSON tal cual lo manda la simulación.
 
    Returns:
        Datos limpios y normalizados listos para el pipeline de IA.
 
    Raises:
        ValueError: Si faltan campos obligatorios.
    """
    # Validar campos obligatorios
    faltantes = [c for c in CAMPOS_REQUERIDOS if c not in datos_simulacion]
    if faltantes:
        raise ValueError(f"Campos faltantes en datos de la simulación: {faltantes}")
 
    camas_totales   = int(datos_simulacion["camas_totales"])
    camas_ocupadas  = int(datos_simulacion["camas_ocupadas"])
    personal_activo = int(datos_simulacion["personal_activo"])
    pacientes_espera = int(datos_simulacion["pacientes_espera"])
    nuevos_pacientes = int(datos_simulacion["nuevos_pacientes"])
    altas_ciclo     = int(datos_simulacion["altas_ciclo"])
 
    # Hora del día desde timestamp (o ahora si no viene)
    timestamp = datos_simulacion.get("timestamp", datetime.now(timezone.utc).isoformat())
    hora_del_dia = _extraer_hora(timestamp)
 
    # Tiempo de espera estimado si no viene explícito
    tiempo_espera_min = _estimar_tiempo_espera(pacientes_espera, personal_activo)
 
    datos_limpios = {
        # ── Datos directos ────────────────────────────────────────────────────
        "camas_totales":          camas_totales,
        "camas_ocupadas":         camas_ocupadas,
        "personal_activo":        personal_activo,
        "pacientes_urgencias":    pacientes_espera,       # mapeo
        "ingresos_ultima_hora":   nuevos_pacientes,       # mapeo
        "altas_ultima_hora":      altas_ciclo,            # mapeo
        "hora_del_dia":           hora_del_dia,
        "tiempo_espera_min":      tiempo_espera_min,
 
        # ── Valores fijos (la simulación no los manda) ────────────────────────
        "personal_total":         TOTAL_PERSONAL,         # constante de config.py
        "quirofanos_totales":     TOTAL_QUIROFANOS,       # constante de config.py
        "quirofanos_activos":     0,                      # área de admisión no tiene
 
        # ── Datos extra útiles para logs ──────────────────────────────────────
        "area":                   datos_simulacion.get("area", "desconocida"),
        "camas_disponibles":      int(datos_simulacion.get("camas_disponibles", 0)),
        "pacientes_atendidos":    int(datos_simulacion.get("pacientes_atendidos", 0)),
        "timestamp":              timestamp,
    }
 
    log.info(
        "Datos transformados → area=%s | camas=%d/%d | personal=%d | espera=%d pac.",
        datos_limpios["area"],
        camas_ocupadas,
        camas_totales,
        personal_activo,
        pacientes_espera,
    )
 
    return datos_limpios