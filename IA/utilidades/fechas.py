"""
utilidades/fechas.py – Helpers de fecha/hora para SOHL-IA
"""

from datetime import datetime, timezone


def ahora_iso() -> str:
    """Retorna timestamp ISO 8601 en UTC."""
    return datetime.now(timezone.utc).isoformat()


def ahora() -> datetime:
    return datetime.now(timezone.utc)


def diferencia_minutos(inicio: datetime, fin: datetime) -> float:
    return (fin - inicio).total_seconds() / 60