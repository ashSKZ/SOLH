import argparse
import json
import os
import re
import shutil
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd
import pytz
from google import genai
from google.genai import types


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def ruta_relativa(nombre_carpeta):
    return os.path.join(BASE_DIR, nombre_carpeta)


DIR_ENTRADA_BATCH = ruta_relativa("imagen de entrada")
DIR_PROCESADOS = ruta_relativa("procesados")
DIR_ERRORES = ruta_relativa("errores")
DIR_REGISTROS = ruta_relativa("registros")
ARCHIVO_EXCEL = os.path.join(DIR_REGISTROS, "check_in_maestro.xlsx")

for carpeta in [DIR_ENTRADA_BATCH, DIR_PROCESADOS, DIR_ERRORES, DIR_REGISTROS]:
    os.makedirs(carpeta, exist_ok=True)


NOMBRE_VARIABLE = "GOOGLE_API_KEY"


def obtener_api_key():
    # 1) Prioridad: variable de entorno del sistema
    api_key_env = os.environ.get(NOMBRE_VARIABLE)
    if api_key_env:
        return api_key_env.strip()

    # 2) Fallback: archivo .env local (sin dependencia externa)
    ruta_env = os.path.join(BASE_DIR, ".env")
    if os.path.exists(ruta_env):
        with open(ruta_env, "r", encoding="utf-8") as f:
            for linea in f:
                linea = linea.strip()
                if not linea or linea.startswith("#"):
                    continue
                if "=" not in linea:
                    continue
                clave, valor = linea.split("=", 1)
                if clave.strip() == NOMBRE_VARIABLE:
                    return valor.strip().strip('"').strip("'")
    return None


api_key = obtener_api_key()
if not api_key:
    raise ValueError(
        "No se encontro GOOGLE_API_KEY. Define la variable de entorno o agrega GOOGLE_API_KEY en .env."
    )

client = genai.Client(api_key=api_key)
MODEL_ID = "gemini-2.5-flash"


def obtener_contexto_cdmx():
    tz_cdmx = pytz.timezone("America/Mexico_City")
    return datetime.now(tz_cdmx)


def calcular_edad(fecha_nac_str, fecha_actual):
    try:
        fecha_nac = datetime.strptime(fecha_nac_str, "%d/%m/%Y")
        edad = fecha_actual.year - fecha_nac.year - (
            (fecha_actual.month, fecha_actual.day) < (fecha_nac.month, fecha_nac.day)
        )
        return edad, edad >= 18
    except Exception:
        return 0, False


def validar_formato_curp(curp):
    if not curp:
        return False
    patron = r"^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$"
    return bool(re.match(patron, curp.upper()))


def guardar_datos(datos, ruta_excel):
    df_nuevo = pd.DataFrame([datos])
    if os.path.exists(ruta_excel):
        df_existente = pd.read_excel(ruta_excel)
        df_final = pd.concat([df_existente, df_nuevo], ignore_index=True)
    else:
        df_final = df_nuevo
    df_final.to_excel(ruta_excel, index=False)


def cargar_curps_registradas(ruta_excel):
    curps = set()
    if not os.path.exists(ruta_excel):
        return curps

    try:
        df_existente = pd.read_excel(ruta_excel)
        if "curp" in df_existente.columns:
            curps = set(df_existente["curp"].astype(str).str.upper().tolist())
    except Exception as e:
        print(f"Aviso: No se pudo leer el historial de duplicados: {e}")

    return curps


def detectar_mime_type(nombre_archivo, mime_header=None):
    if mime_header and mime_header.startswith("image/"):
        return mime_header

    ext = Path(nombre_archivo).suffix.lower()
    if ext in [".jpg", ".jpeg"]:
        return "image/jpeg"
    if ext == ".png":
        return "image/png"

    return "application/octet-stream"


def extraer_boundary(content_type):
    match = re.search(r'boundary=(?:"([^"]+)"|([^;]+))', content_type, flags=re.IGNORECASE)
    if not match:
        raise ValueError("No se encontro boundary en Content-Type.")
    return (match.group(1) or match.group(2)).strip()


def parsear_multipart_form_data(body_bytes, content_type):
    boundary = extraer_boundary(content_type).encode("utf-8")
    delimiter = b"--" + boundary
    partes = body_bytes.split(delimiter)
    campos = {}

    for parte in partes:
        parte = parte.strip(b"\r\n")
        if not parte or parte == b"--":
            continue

        if parte.endswith(b"--"):
            parte = parte[:-2]

        encabezados_raw, separador, contenido = parte.partition(b"\r\n\r\n")
        if not separador:
            continue

        encabezados = encabezados_raw.decode("utf-8", errors="ignore")
        dispo = re.search(r"Content-Disposition:\s*form-data;\s*(.+)", encabezados, flags=re.IGNORECASE)
        if not dispo:
            continue

        attrs = dispo.group(1)
        nombre = re.search(r'name="([^"]+)"', attrs)
        archivo = re.search(r'filename="([^"]*)"', attrs)
        tipo = re.search(r"Content-Type:\s*([^\r\n]+)", encabezados, flags=re.IGNORECASE)

        if not nombre:
            continue

        campo_nombre = nombre.group(1)
        campos[campo_nombre] = {
            "filename": archivo.group(1) if archivo else "",
            "type": tipo.group(1).strip() if tipo else "",
            "value": contenido.rstrip(b"\r\n"),
        }

    return campos


def extraer_datos_con_gemini(image_bytes, mime_type, fecha_hoy_str):
    prompt = (
        f"Actua como sistema de check-in. Hoy es {fecha_hoy_str}. "
        f"Analiza la INE y extrae estrictamente en formato JSON: "
        f"nombre, apellido_paterno, apellido_materno, curp, fecha_nacimiento, sexo."
    )

    response = client.models.generate_content(
        model=MODEL_ID,
        contents=[prompt, types.Part.from_bytes(data=image_bytes, mime_type=mime_type)],
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1),
    )

    return json.loads(response.text)


def procesar_archivo_ine(ruta_origen, nombre_archivo, mime_type=None):
    ahora_cdmx = obtener_contexto_cdmx()
    fecha_hoy_str = ahora_cdmx.strftime("%d/%m/%Y")

    curps_registradas = cargar_curps_registradas(ARCHIVO_EXCEL)

    with open(ruta_origen, "rb") as f:
        image_bytes = f.read()

    mime_archivo = detectar_mime_type(nombre_archivo, mime_type)
    if not mime_archivo.startswith("image/"):
        raise ValueError("Tipo de archivo no soportado. Solo se permite imagen.")

    intentos = 0
    max_intentos = 3

    while intentos < max_intentos:
        try:
            datos = extraer_datos_con_gemini(image_bytes, mime_archivo, fecha_hoy_str)
            curp_leida = datos.get("curp", "").upper()

            if curp_leida in curps_registradas:
                destino = os.path.join(DIR_PROCESADOS, nombre_archivo)
                shutil.move(ruta_origen, destino)
                return {
                    "ok": True,
                    "datos": datos,
                    "guardado_xlsx": True,
                    "mensaje": "La CURP ya existia. Se considero registro previamente guardado.",
                    "duplicado": True,
                }

            edad, es_mayor = calcular_edad(datos.get("fecha_nacimiento", ""), ahora_cdmx)
            datos.update(
                {
                    "edad_calculada": edad,
                    "es_mayor_de_edad": "SI" if es_mayor else "NO",
                    "curp_valida": validar_formato_curp(curp_leida),
                    "fecha_registro": ahora_cdmx.strftime("%Y-%m-%d %H:%M:%S"),
                    "archivo_fuente": nombre_archivo,
                }
            )

            guardar_datos(datos, ARCHIVO_EXCEL)
            destino = os.path.join(DIR_PROCESADOS, nombre_archivo)
            shutil.move(ruta_origen, destino)

            return {
                "ok": True,
                "datos": {
                    "nombre": datos.get("nombre", ""),
                    "apellido_paterno": datos.get("apellido_paterno", ""),
                    "apellido_materno": datos.get("apellido_materno", ""),
                    "curp": datos.get("curp", ""),
                    "fecha_nacimiento": datos.get("fecha_nacimiento", ""),
                    "sexo": datos.get("sexo", ""),
                },
                "guardado_xlsx": True,
                "mensaje": "Registro almacenado en check_in_maestro.xlsx",
                "duplicado": False,
            }

        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg:
                intentos += 1
                espera = 20 * intentos
                print(f"Cuota agotada (429). Reintentando en {espera} segundos... (Intento {intentos})")
                time.sleep(espera)
                continue

            if "404" in error_msg:
                destino = os.path.join(DIR_ERRORES, nombre_archivo)
                shutil.move(ruta_origen, destino)
                raise RuntimeError(f"Error 404: Modelo '{MODEL_ID}' no encontrado.")

            destino = os.path.join(DIR_ERRORES, nombre_archivo)
            if os.path.exists(ruta_origen):
                shutil.move(ruta_origen, destino)
            raise

    raise RuntimeError("No fue posible procesar la imagen despues de varios intentos.")


def procesar_extractor():
    extensiones = (".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG")
    archivos = [f for f in os.listdir(DIR_ENTRADA_BATCH) if f.endswith(extensiones)]

    if not archivos:
        print(f"No hay imagenes nuevas para procesar en: {DIR_ENTRADA_BATCH}")
        return

    exitos, fallos = 0, 0

    for nombre_archivo in archivos:
        ruta_origen = os.path.join(DIR_ENTRADA_BATCH, nombre_archivo)
        print(f"\n--- Analizando: {nombre_archivo} ---")

        try:
            resultado = procesar_archivo_ine(ruta_origen, nombre_archivo)
            if resultado.get("ok"):
                print(f"Registro completado: {resultado.get('mensaje', 'OK')}")
                exitos += 1
        except Exception as e:
            print(f"Error procesando {nombre_archivo}: {e}")
            fallos += 1

    print("\nProceso finalizado.")
    print(f"Exitos: {exitos} | Errores: {fallos}")


class ManejadorExtractorHTTP(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _set_headers(self, codigo=200, content_type="application/json; charset=utf-8"):
        self.send_response(codigo)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _responder_json(self, codigo, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self._set_headers(codigo)
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        ruta = urlparse(self.path).path
        if ruta == "/health":
            self._responder_json(200, {"ok": True, "servicio": "extractor-ine"})
            return
        self._responder_json(404, {"ok": False, "error": "Ruta no encontrada"})

    def do_POST(self):
        ruta = urlparse(self.path).path
        if ruta != "/extractor/procesar":
            self._responder_json(404, {"ok": False, "error": "Ruta no encontrada"})
            return

        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self._responder_json(400, {"ok": False, "error": "Se esperaba multipart/form-data"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0:
                self._responder_json(400, {"ok": False, "error": "Body vacio."})
                return

            body = self.rfile.read(content_length)
            form = parsear_multipart_form_data(body, content_type)

            if "imagen" not in form:
                self._responder_json(400, {"ok": False, "error": "Falta el campo 'imagen'"})
                return

            imagen = form["imagen"]
            nombre_original = os.path.basename(imagen.get("filename") or "ine_subida.jpg")
            extension = Path(nombre_original).suffix.lower() or ".jpg"

            if extension not in [".jpg", ".jpeg", ".png"]:
                self._responder_json(400, {"ok": False, "error": "Formato no soportado. Usa JPG o PNG."})
                return

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            nombre_archivo = f"web_{timestamp}{extension}"
            ruta_temporal = os.path.join(DIR_ENTRADA_BATCH, nombre_archivo)

            contenido = imagen.get("value", b"")
            if not contenido:
                self._responder_json(400, {"ok": False, "error": "La imagen esta vacia."})
                return

            with open(ruta_temporal, "wb") as f:
                f.write(contenido)

            resultado = procesar_archivo_ine(
                ruta_temporal,
                nombre_archivo,
                mime_type=imagen.get("type", ""),
            )
            self._responder_json(200, resultado)

        except Exception as e:
            self._responder_json(
                500,
                {
                    "ok": False,
                    "guardado_xlsx": False,
                    "error": f"Error procesando imagen: {e}",
                },
            )


def iniciar_servidor(host="0.0.0.0", port=8000):
    servidor = HTTPServer((host, port), ManejadorExtractorHTTP)
    print(f"Extractor API activa en http://{host}:{port}")
    print("- POST /extractor/procesar")
    print("- GET  /health")

    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
        servidor.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--modo", choices=["batch", "server"], default="batch")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if args.modo == "server":
        iniciar_servidor(host=args.host, port=args.port)
    else:
        procesar_extractor()
