import os
import random
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
from faker import Faker

# 1. SETUP
fake = Faker('es_MX')
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIR_SALIDA = os.path.join(BASE_DIR, "dataset_ine_masivo")
os.makedirs(DIR_SALIDA, exist_ok=True)

# 2. MAPA DE POSICIONES (x_etiqueta, y_etiqueta, x_dato, y_dato)
# Ajustado para una resolución de 1200x750 (proporción de ID)
POSICIONES = {
    "nombre_bloque": {
        "label": (450, 100, "NOMBRE"),
        "datos": [
            (450, 120, "apellido_p"),
            (450, 145, "apellido_m"),
            (450, 170, "nombres")
        ]
    },
    "clave_elector": (450, 320, 450, 338),
    "curp": (450, 370, 450, 388),
    "nacimiento": (450, 420, 450, 438),
    "registro": (680, 370, 680, 388),
    "seccion": (580, 420, 580, 438),
    "vigencia": (700, 420, 700, 438),
    "sexo": (820, 100, 880, 100) # El sexo va a la derecha del nombre
}

def generar_datos_ine():
    anio_reg = random.randint(1991, 2026)
    vigencia_inicio = max(2022, anio_reg)
    return {
        "nombres": fake.first_name().upper(),
        "apellido_p": fake.last_name().upper(),
        "apellido_m": fake.last_name().upper(),
        "sexo": random.choice(["H", "M"]),
        "clave_elector": fake.bothify(text='??????##?#??######').upper(),
        "curp": fake.curp(),
        "nacimiento": fake.date_of_birth(minimum_age=18).strftime("%d/%m/%Y"),
        "registro": str(anio_reg),
        "seccion": str(random.randint(100, 5000)).zfill(4),
        "vigencia": f"{vigencia_inicio}-{vigencia_inicio+10}"
    }

def dibujar_ine_sintetica(datos, indice):
    # Fondo color crema INE
    img = Image.new('RGB', (1200, 750), color=(242, 241, 235))
    draw = ImageDraw.Draw(img)
    
    try:
        font_label = ImageFont.truetype("arial.ttf", 14)
        font_data = ImageFont.truetype("arialbd.ttf", 22)
    except:
        font_label = font_data = ImageFont.load_default()

    # --- Bloque de Nombre ---
    lx, ly, txt = POSICIONES["nombre_bloque"]["label"]
    draw.text((lx, ly), txt, fill=(120, 120, 120), font=font_label)
    for dx, dy, key in POSICIONES["nombre_bloque"]["datos"]:
        draw.text((dx, dy), datos[key], fill="black", font=font_data)

    # --- Bloque de Sexo ---
    draw.text((POSICIONES["sexo"][0], POSICIONES["sexo"][1]), "SEXO", fill=(120, 120, 120), font=font_label)
    draw.text((POSICIONES["sexo"][2], POSICIONES["sexo"][3]), datos["sexo"], fill="black", font=font_data)

    # --- Bloques Inferiores (Clave, CURP, Registro, etc.) ---
    campos_inf = ["clave_elector", "curp", "nacimiento", "registro", "seccion", "vigencia"]
    for campo in campos_inf:
        lx, ly, dx, dy = POSICIONES[campo]
        label_txt = campo.replace("_", " ").upper()
        draw.text((lx, ly), label_txt, fill=(120, 120, 120), font=font_label)
        draw.text((dx, dy), datos[campo], fill="black", font=font_data)

    # Guardado robusto para rutas con acentos
    nombre_archivo = f"ine_test_{indice}.jpg"
    ruta_temp = os.path.join(DIR_SALIDA, nombre_archivo)
    
    # Aplicar realismo con OpenCV antes de guardar final
    img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    
    # Rotación aleatoria leve (perspectiva de foto)
    h, w = img_cv.shape[:2]
    M = cv2.getRotationMatrix2D((w/2, h/2), random.uniform(-1.5, 1.5), 1)
    img_cv = cv2.warpAffine(img_cv, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
    
    # Guardado con soporte para rutas especiales
    is_success, buffer = cv2.imencode(".jpg", img_cv)
    if is_success:
        with open(ruta_temp, "wb") as f:
            f.write(buffer)
    return ruta_temp

if __name__ == "__main__":
    CANTIDAD = 10
    print(f"Generando {CANTIDAD} muestras para proyecto SOLH...")
    for i in range(CANTIDAD):
        data = generar_datos_ine()
        dibujar_ine_sintetica(data, i)
    print("Dataset generado exitosamente.")