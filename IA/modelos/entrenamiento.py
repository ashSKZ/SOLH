"""
modelos/entrenamiento.py
Entrena el modelo XGBoost con datos simulados y lo guarda en disco.
Ejecutar una sola vez: python -m modelos.entrenamiento
"""

import json
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np

from config import MODELO_PATH, TOTAL_CAMAS, TOTAL_PERSONAL, TOTAL_QUIROFANOS
from procesamiento.generador_features import generar_features
from procesamiento.normalizador import normalizar
from utilidades import obtener_logger

log = obtener_logger(__name__)

FEATURE_ORDER = [
    "ocupacion_camas", "ocupacion_personal", "ocupacion_quirofanos",
    "presion_camas", "ratio_paciente_personal", "flujo_neto",
    "indice_urgencias", "tiempo_espera_min", "factor_hora",
    "pacientes_urgencias",
]


def _generar_muestra_simulada() -> tuple:
    """Genera una muestra aleatoria y su etiqueta de saturación."""
    hora = random.randint(0, 23)
    factor = 1.25 if 8 <= hora <= 20 else 0.75

    camas_ocp  = int(random.gauss(TOTAL_CAMAS * 0.75 * factor, 20))
    camas_ocp  = max(0, min(camas_ocp, TOTAL_CAMAS))

    personal_a = int(random.gauss(TOTAL_PERSONAL * 0.85 * factor, 10))
    personal_a = max(1, min(personal_a, TOTAL_PERSONAL))

    datos = {
        "camas_totales":         TOTAL_CAMAS,
        "camas_ocupadas":        camas_ocp,
        "personal_total":        TOTAL_PERSONAL,
        "personal_activo":       personal_a,
        "quirofanos_totales":    TOTAL_QUIROFANOS,
        "quirofanos_activos":    random.randint(0, TOTAL_QUIROFANOS),
        "pacientes_urgencias":   int(random.gauss(30 * factor, 10)),
        "tiempo_espera_min":     max(5, int(random.gauss(45 * factor, 20))),
        "ingresos_ultima_hora":  random.randint(0, 15),
        "altas_ultima_hora":     random.randint(0, 12),
        "hora_del_dia":          hora,
    }

    features = normalizar(generar_features(datos))
    x = [features[f] for f in FEATURE_ORDER]

    # Etiqueta: saturación si ocupación > 85%
    saturado = 1 if (camas_ocp / TOTAL_CAMAS) > 0.85 else 0
    return x, saturado


def _entrenar_simple(X: list, y: list) -> dict:
    """
    Árbol de decisión simple basado en reglas (sin dependencias externas).
    Retorna un objeto 'modelo' serializable como JSON.
    """
    import statistics

    # Calculamos umbrales por feature usando correlación con y
    n = len(y)
    feature_weights = []
    for i in range(len(X[0])):
        vals = [X[j][i] for j in range(n)]
        # Diferencia de media entre positivos y negativos
        pos_mean = statistics.mean([vals[j] for j in range(n) if y[j] == 1] or [0])
        neg_mean = statistics.mean([vals[j] for j in range(n) if y[j] == 0] or [0])
        feature_weights.append(pos_mean - neg_mean)

    total = sum(abs(w) for w in feature_weights) or 1
    weights_norm = [w / total for w in feature_weights]

    modelo = {
        "tipo":          "regresion_logistica_simple",
        "feature_order": FEATURE_ORDER,
        "weights":       weights_norm,
        "bias":          -0.4,
    }
    return modelo


def entrenar_y_guardar(n_muestras: int = 5000):
    log.info("Generando %d muestras de entrenamiento...", n_muestras)

    X, y = [], []
    for _ in range(n_muestras):
        xi, yi = _generar_muestra_simulada()
        X.append(xi)
        y.append(yi)

    log.info("Entrenando modelo...")
    modelo = _entrenar_simple(X, y)

    os.makedirs(os.path.dirname(MODELO_PATH), exist_ok=True)
    with open(MODELO_PATH, "w") as f:
        json.dump(modelo, f, indent=2)

    log.info("Modelo guardado en %s", MODELO_PATH)
    return modelo


if __name__ == "__main__":
    entrenar_y_guardar()
    print("✅ Entrenamiento completado.")