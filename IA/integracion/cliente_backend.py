"""
integracion/cliente_backend.py
Envía los resultados de la IA al backend principal del sistema SOHL.
"""

import json
import urllib.request
import urllib.error
from typing import Any, Dict

from config import ENDPOINT_ALERTA, ENDPOINT_ESTADO
from utilidades import obtener_logger

log = obtener_logger(__name__)


def _post(url: str, payload: Dict[str, Any]) -> bool:
    """Hace POST al backend. Retorna True si fue exitoso."""
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            log.info("Backend respondió %d en %s", resp.status, url)
            return resp.status in (200, 201, 202)
    except urllib.error.URLError as e:
        log.warning("Backend no disponible (%s): %s", url, e.reason)
        return False
    except Exception as e:
        log.error("Error inesperado al contactar backend: %s", e)
        return False


def enviar_alerta(payload: Dict[str, Any]) -> bool:
    """Envía alerta al endpoint de alertas."""
    log.info("Enviando alerta al backend → nivel=%s",
             payload.get("prediccion", {}).get("nivel_riesgo", "?"))
    return _post(ENDPOINT_ALERTA, payload)


def actualizar_estado(payload: Dict[str, Any]) -> bool:
    """Actualiza estado de IA en el backend (health-check extendido)."""
    return _post(ENDPOINT_ESTADO, payload)