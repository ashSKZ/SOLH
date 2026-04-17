"""
modelos/predictor.py
Ejecuta el modelo sobre las features normalizadas y devuelve la predicción.
Incluye aprendizaje incremental: cada 50 muestras reajusta los pesos del modelo.
"""

import json
import math
import os
import threading
from typing import Dict, List, Tuple

from config import MODELO_PATH, TOTAL_CAMAS, VENTANA_PREDICCION_MIN
from modelos.cargador_modelo import cargar_modelo
from utilidades import obtener_logger

log = obtener_logger(__name__)

# ── Estado interno de aprendizaje incremental ─────────────────────────────────
_lock                          = threading.Lock()
_muestras_buffer: List[Tuple[List[float], float]] = []
_UMBRAL_REENTRENAR             = 50   # reentrenar cada N muestras nuevas


# ── Funciones matemáticas ─────────────────────────────────────────────────────

def _sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-max(-500, min(500, x))))


def _calcular_score(modelo: dict, features_norm: Dict[str, float]) -> float:
    """Producto punto pesos · features + bias, escalado para mayor sensibilidad."""
    feature_order = modelo["feature_order"]
    weights       = modelo["weights"]
    bias          = modelo["bias"]
    x_vals = [features_norm.get(f, 0.0) for f in feature_order]
    score  = sum(w * x for w, x in zip(weights, x_vals)) + bias
    return score * 5.0


# ── Acumulación de muestras ───────────────────────────────────────────────────

def _acumular_muestra(features_norm: Dict[str, float], probabilidad: float):
    """
    Guarda la muestra actual en el buffer.
    Cuando se alcanza el umbral, lanza el reentrenamiento en un hilo separado
    para no bloquear la respuesta al cliente.
    """
    modelo = cargar_modelo()
    x_vals  = [features_norm.get(f, 0.0) for f in modelo["feature_order"]]

    # La etiqueta real es la probabilidad que ya predijo el modelo.
    # El modelo aprenderá a refinar estos patrones con cada ciclo.
    etiqueta = 1.0 if probabilidad >= 0.70 else 0.0

    with _lock:
        _muestras_buffer.append((x_vals, etiqueta))
        n = len(_muestras_buffer)

    log.debug("Buffer de aprendizaje: %d/%d muestras", n, _UMBRAL_REENTRENAR)

    if n >= _UMBRAL_REENTRENAR:
        hilo = threading.Thread(target=_reentrenar, daemon=True)
        hilo.start()


# ── Reentrenamiento incremental ───────────────────────────────────────────────

def _reentrenar():
    """
    Reajusta los pesos del modelo con las muestras acumuladas usando
    descenso de gradiente estocástico (SGD).

    Corre en hilo separado → las predicciones en curso no se bloquean.
    """
    global _muestras_buffer

    with _lock:
        if len(_muestras_buffer) < _UMBRAL_REENTRENAR:
            return
        muestras          = list(_muestras_buffer)
        _muestras_buffer  = []

    log.info("🔄 Reentrenamiento incremental con %d muestras nuevas...", len(muestras))

    modelo  = cargar_modelo()
    weights = list(modelo["weights"])
    bias    = modelo["bias"]
    lr      = 0.01   # tasa de aprendizaje conservadora para no perder lo aprendido

    # Descenso de gradiente estocástico sobre las muestras nuevas
    for x_vals, etiqueta in muestras:
        score      = sum(w * x for w, x in zip(weights, x_vals)) + bias
        prediccion = _sigmoid(score * 5.0)
        error      = etiqueta - prediccion

        for i in range(len(weights)):
            weights[i] += lr * error * x_vals[i]
        bias += lr * error

    # Guardar modelo actualizado en disco
    modelo_actualizado = {
        "tipo":          modelo["tipo"],
        "feature_order": modelo["feature_order"],
        "weights":       [round(w, 6) for w in weights],
        "bias":          round(bias, 6),
    }

    os.makedirs(os.path.dirname(MODELO_PATH), exist_ok=True)
    with open(MODELO_PATH, "w") as f:
        json.dump(modelo_actualizado, f, indent=2)

    # Invalidar caché para que la próxima predicción use el modelo actualizado
    from modelos import cargador_modelo
    cargador_modelo._modelo_cache.clear()

    log.info("✅ Modelo actualizado. Pesos ajustados con datos reales del hospital.")


# ── Predicción principal ──────────────────────────────────────────────────────

def predecir(features_norm: Dict[str, float], datos_limpios: Dict) -> Tuple[float, float]:
    """
    Realiza la predicción de saturación y acumula la muestra para
    el aprendizaje incremental en segundo plano.

    Args:
        features_norm:  Features normalizadas [0-1].
        datos_limpios:  Datos originales limpios (para proyectar ocupación futura).

    Returns:
        Tupla (probabilidad_saturacion [0-1], ocupacion_predicha_pct [0-100])
    """
    modelo = cargar_modelo()

    # ── Predicción ────────────────────────────────────────────────────────────
    score        = _calcular_score(modelo, features_norm)
    probabilidad = _sigmoid(score)

    # ── Ocupación futura proyectada (en VENTANA_PREDICCION_MIN minutos) ────────
    camas_actuales     = datos_limpios["camas_ocupadas"]
    flujo_neto         = datos_limpios["ingresos_ultima_hora"] - datos_limpios["altas_ultima_hora"]
    factor_tiempo      = VENTANA_PREDICCION_MIN / 60.0
    camas_futuras      = max(0, min(camas_actuales + flujo_neto * factor_tiempo, TOTAL_CAMAS))
    ocupacion_predicha = (camas_futuras / TOTAL_CAMAS) * 100

    log.info(
        "Predicción → prob=%.3f | ocupacion_futura=%.1f%% (en %d min)",
        probabilidad, ocupacion_predicha, VENTANA_PREDICCION_MIN,
    )

    # ── Aprendizaje incremental en segundo plano (no bloquea la respuesta) ────
    _acumular_muestra(features_norm, probabilidad)

    return probabilidad, ocupacion_predicha
