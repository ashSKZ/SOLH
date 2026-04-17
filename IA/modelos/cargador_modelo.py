"""
modelos/cargador_modelo.py
Carga el modelo entrenado desde disco. Si no existe, lo entrena primero.
"""

import json
import os
from typing import Any, Dict

from config import MODELO_PATH
from utilidades import obtener_logger

log = obtener_logger(__name__)

_modelo_cache: Dict[str, Any] = {}


def cargar_modelo() -> Dict[str, Any]:
    """
    Retorna el modelo cargado. Usa caché en memoria para evitar
    lecturas repetidas de disco.
    """
    global _modelo_cache

    if _modelo_cache:
        return _modelo_cache

    if not os.path.exists(MODELO_PATH):
        log.warning("Modelo no encontrado. Entrenando desde cero...")
        from modelos.entrenamiento import entrenar_y_guardar
        entrenar_y_guardar()

    with open(MODELO_PATH, "r") as f:
        _modelo_cache = json.load(f)

    log.info("Modelo cargado desde %s", MODELO_PATH)
    return _modelo_cache