import os
import json
import re
import shutil
import time
from datetime import datetime
import pytz
from google import genai
from google.genai import types
import pandas as pd


# 1. CONFIGURACION DE RUTAS AUTOMATICAS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def ruta_relativa(nombre_carpeta):
    return os.path.join(BASE_DIR, nombre_carpeta)

# 2. CONFIGURACION DEL CLIENTE Y MODELO
NOMBRE_VARIABLE = "GOOGLE_API_KEY" 
api_key = os.environ.get(NOMBRE_VARIABLE)
if not api_key:
    raise ValueError("No se encontro la variable de entorno GOOGLE_API_KEY en el sistema.")

client = genai.Client(api_key=api_key)

MODEL_ID = "gemini-2.5-flash" 

# 3. FUNCIONES DE APOYO
def obtener_contexto_cdmx():
    """Obtiene la fecha y hora actual con la zona horaria de Ciudad de Mexico."""
    tz_cdmx = pytz.timezone('America/Mexico_City')
    return datetime.now(tz_cdmx)

def calcular_edad(fecha_nac_str, fecha_actual):
    """Calcula la edad exacta y verifica si es mayor de 18 anos."""
    try:
        # La IA extrae la fecha en formato DD/MM/AAAA
        fecha_nac = datetime.strptime(fecha_nac_str, "%d/%m/%Y")
        edad = fecha_actual.year - fecha_nac.year - (
            (fecha_actual.month, fecha_actual.day) < (fecha_nac.month, fecha_nac.day)
        )
        return edad, edad >= 18
    except:
        return 0, False

def validar_formato_curp(curp):
    """Valida la estructura oficial de la CURP mediante Regex."""
    if not curp: return False
    patron = r'^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$'
    return bool(re.match(patron, curp.upper()))

def guardar_datos(datos, ruta_excel):
    """Almacena el registro en el archivo Excel maestro."""
    df_nuevo = pd.DataFrame([datos])
    if os.path.exists(ruta_excel):
        df_existente = pd.read_excel(ruta_excel)
        df_final = pd.concat([df_existente, df_nuevo], ignore_index=True)
    else:
        df_final = df_nuevo
    df_final.to_excel(ruta_excel, index=False)

# 4. LOGICA PRINCIPAL DE PROCESAMIENTO
def procesar_extractor():
    dir_entrada = ruta_relativa("imagen de entrada")
    dir_procesados = ruta_relativa("procesados")
    dir_errores = ruta_relativa("errores")
    dir_registros = ruta_relativa("registros")
    archivo_excel = os.path.join(dir_registros, "check_in_maestro.xlsx")
    
    # Asegurar la existencia de todas las carpetas necesarias
    for carpeta in [dir_entrada, dir_procesados, dir_errores, dir_registros]:
        os.makedirs(carpeta, exist_ok=True)
    
    ahora_cdmx = obtener_contexto_cdmx()
    fecha_hoy_str = ahora_cdmx.strftime("%d/%m/%Y")
    
    extensiones = ('.jpg', '.jpeg', '.JPG', '.JPEG')
    archivos = [f for f in os.listdir(dir_entrada) if f.endswith(extensiones)]
    
    if not archivos:
        print(f"No hay imagenes nuevas para procesar en: {dir_entrada}")
        return

    # Cargar registros previos para evitar duplicados
    curps_registradas = set()
    if os.path.exists(archivo_excel):
        try:
            df_existente = pd.read_excel(archivo_excel)
            if "curp" in df_existente.columns:
                curps_registradas = set(df_existente["curp"].astype(str).str.upper().tolist())
        except Exception as e:
            print(f"Aviso: No se pudo leer el historial de duplicados: {e}")

    exitos, fallos = 0, 0

    for nombre_archivo in archivos:
        ruta_origen = os.path.join(dir_entrada, nombre_archivo)
        print(f"\n--- Analizando: {nombre_archivo} ---")

        intentos = 0
        max_intentos = 3
        exito_api = False

        while intentos < max_intentos and not exito_api:
            try:
                with open(ruta_origen, "rb") as f:
                    image_bytes = f.read()

                prompt = (f"Actua como sistema de check-in. Hoy es {fecha_hoy_str}. "
                          f"Analiza la INE y extrae estrictamente en formato JSON: "
                          f"nombre, apellido_paterno, apellido_materno, curp, fecha_nacimiento, sexo.")
                
                # Llamada al modelo con configuracion de respuesta JSON
                response = client.models.generate_content(
                    model=MODEL_ID,
                    contents=[
                        prompt,
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type='application/json',
                        temperature=0.1
                    )
                )
                
                datos = json.loads(response.text)
                curp_leida = datos.get("curp", "").upper()

                # Prevencion de registros duplicados
                if curp_leida in curps_registradas:
                    print(f"Omitiendo {nombre_archivo}: La CURP ya se encuentra en la base de datos.")
                    shutil.move(ruta_origen, os.path.join(dir_procesados, nombre_archivo))
                    exito_api = True
                    continue

                # Procesamiento de Edad y Validacion
                edad, es_mayor = calcular_edad(datos.get("fecha_nacimiento", ""), ahora_cdmx)
                datos.update({
                    "edad_calculada": edad,
                    "es_mayor_de_edad": "SI" if es_mayor else "NO",
                    "curp_valida": validar_formato_curp(curp_leida),
                    "fecha_registro": ahora_cdmx.strftime("%Y-%m-%d %H:%M:%S"),
                    "archivo_fuente": nombre_archivo
                })
                
                guardar_datos(datos, archivo_excel)
                curps_registradas.add(curp_leida)
                
                # Mover archivo a la carpeta de procesados tras exito
                shutil.move(ruta_origen, os.path.join(dir_procesados, nombre_archivo))
                
                print(f"Registro completado exitosamente: {datos.get('nombre')}")
                exitos += 1
                exito_api = True
                
                # Pausa de seguridad para evitar saturar la cuota gratuita
                time.sleep(5)

            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg:
                    intentos += 1
                    espera = 20 * intentos
                    print(f"Cuota agotada (429). Reintentando en {espera} segundos... (Intento {intentos})")
                    time.sleep(espera)
                elif "404" in error_msg:
                    print(f"Error 404: El modelo '{MODEL_ID}' no fue encontrado. Verifique su disponibilidad.")
                    shutil.move(ruta_origen, os.path.join(dir_errores, nombre_archivo))
                    fallos += 1
                    break
                else:
                    print(f"Error procesando {nombre_archivo}: {error_msg}")
                    shutil.move(ruta_origen, os.path.join(dir_errores, nombre_archivo))
                    fallos += 1
                    break

    print(f"\nProceso finalizado.")
    print(f"Exitos: {exitos} | Errores: {fallos}")

if __name__ == "__main__":
    procesar_extractor()