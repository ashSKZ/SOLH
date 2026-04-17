"""
api/rutas_ia.py
Define los endpoints Flask del módulo de IA.
Orquesta el flujo completo: recibir → limpiar → features → predecir → clasificar → enviar.
"""

import json
from http.server import BaseHTTPRequestHandler
from typing import Any, Dict

from simulacion.transformador_entrada import transformar
from procesamiento.generador_features import generar_features
from procesamiento.normalizador import normalizar
from procesamiento.clasificador_riesgo import clasificar
from modelos.predictor import predecir
from integracion.publicador_resultados import construir_payload
from integracion.cliente_backend import enviar_alerta
from utilidades import obtener_logger

log = obtener_logger(__name__)


def ejecutar_pipeline(datos_crudos: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pipeline completo de IA.
    Recibe datos crudos y retorna el payload final con la predicción.

    Pasos:
        1. Transformar (limpiar y validar)
        2. Generar features
        3. Normalizar
        4. Predecir (modelo)
        5. Clasificar riesgo
        6. Construir payload
        7. Enviar al backend
    """
    log.info("── Iniciando pipeline de IA ──────────────────────────")

    # 1. Transformar
    datos_limpios = transformar(datos_crudos)

    # 2. Features
    features = generar_features(datos_limpios)

    # 3. Normalizar
    features_norm = normalizar(features)

    # 4. Predecir
    probabilidad, ocupacion_predicha = predecir(features_norm, datos_limpios)

    # 5. Clasificar
    clasificacion = clasificar(probabilidad, ocupacion_predicha)

    # 6. Construir payload
    payload = construir_payload(datos_limpios, clasificacion)

    # 7. Enviar al backend (no bloqueante ante fallos)
    enviado = enviar_alerta(payload)
    payload["enviado_backend"] = enviado

    log.info(
        "── Pipeline completado → riesgo=%s | prob=%.2f | ocupacion=%.1f%% ──",
        clasificacion["nivel_riesgo"],
        probabilidad,
        ocupacion_predicha,
    )
    return payload


class ManejadorHTTP(BaseHTTPRequestHandler):
    """
    Servidor HTTP mínimo sin dependencias externas.
    En producción reemplazar por Flask / FastAPI.
    """

    def log_message(self, format, *args):  # silencia logs del servidor base
        pass

    def _responder(self, codigo: int, cuerpo: Dict):
        body = json.dumps(cuerpo, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._responder(200, {"status": "ok", "servicio": "SOHL-IA"})
        else:
            self._responder(404, {"error": "ruta no encontrada"})

    def do_POST(self):
        if self.path != "/ia/predecir":
            self._responder(404, {"error": "ruta no encontrada"})
            return

        longitud = int(self.headers.get("Content-Length", 0))
        if longitud == 0:
            self._responder(400, {"error": "body vacío"})
            return

        try:
            body = self.rfile.read(longitud)
            datos_crudos = json.loads(body)
        except json.JSONDecodeError as e:
            self._responder(400, {"error": f"JSON inválido: {e}"})
            return

        try:
            resultado = ejecutar_pipeline(datos_crudos)
            self._responder(200, resultado)
        except ValueError as e:
            log.error("Error de validación: %s", e)
            self._responder(422, {"error": str(e)})
        except Exception as e:
            log.error("Error interno: %s", e, exc_info=True)
            self._responder(500, {"error": "error interno del servidor"})