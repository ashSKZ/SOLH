"""
app.py – Punto de entrada del módulo de IA de SOHL.

Uso:
    # Arrancar servidor
    python app.py

    # Solo entrenar modelo
    python app.py --entrenar

    # Demo: ejecutar una predicción de prueba
    python app.py --demo
"""

import sys
import os
from http.server import HTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import IA_HOST, IA_PORT
from utilidades import obtener_logger

log = obtener_logger("SOHL-IA")


def arrancar_servidor():
    from api.rutas_ia import ManejadorHTTP

    log.info("Cargando modelo de IA...")
    from modelos.cargador_modelo import cargar_modelo
    cargar_modelo()

    servidor = HTTPServer((IA_HOST, IA_PORT), ManejadorHTTP)
    log.info("🏥 SOHL-IA corriendo en http://%s:%d", IA_HOST, IA_PORT)
    log.info("   POST /ia/predecir  → predicción de saturación")
    log.info("   GET  /health       → estado del servicio")

    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        log.info("Servidor detenido.")
        servidor.server_close()


def demo():
    """Ejecuta una predicción completa con datos simulados e imprime el resultado."""
    import json
    from simulacion.receptor_simulacion import generar_datos_hospital
    from api.rutas_ia import ejecutar_pipeline

    log.info("── DEMO: predicción con datos simulados ──────────────")
    datos = generar_datos_hospital()
    resultado = ejecutar_pipeline(datos)

    print("\n" + "="*60)
    print("  RESULTADO DE PREDICCIÓN SOHL-IA")
    print("="*60)
    print(json.dumps(resultado, indent=2, ensure_ascii=False))
    print("="*60 + "\n")


def entrenar():
    from modelos.entrenamiento import entrenar_y_guardar
    log.info("Iniciando entrenamiento del modelo...")
    entrenar_y_guardar()
    log.info("✅ Modelo entrenado y guardado.")


if __name__ == "__main__":
    args = sys.argv[1:]

    if "--demo" in args:
        demo()
    elif "--entrenar" in args:
        entrenar()
    else:
        arrancar_servidor()