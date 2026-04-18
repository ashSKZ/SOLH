# SOLH

Sistema de Optimizacion Logistica Hospitalaria para monitoreo operativo, simulacion de carga hospitalaria y extraccion de datos de identificacion con Gemini.

## 1) Estructura del proyecto

- `Backend/`: API principal del sistema (Node.js/Express).
- `Frontend/`: interfaz web del dashboard (HTML/CSS/JS).
- `Simulacion/`: generacion y envio continuo de snapshots hospitalarios.
- `Extractor de datos/`: servicio de extraccion de INE con Gemini y guardado en XLSX.
- `IA/`: componentes de prediccion y transformacion de datos.

## 2) Requisitos

- Node.js 18+ y npm
- Python 3.10+ (recomendado 3.10-3.13)
- Conexion a internet para invocar Gemini

## 3) Variable de entorno requerida (Gemini)

Debes configurar `GOOGLE_API_KEY` antes de ejecutar el extractor.

### Opcion A: Variable de entorno del sistema (PowerShell)

```powershell
$env:GOOGLE_API_KEY="TU_API_KEY_AQUI"
```

### Opcion B: Archivo local `.env`

Crear `Extractor de datos/.env` con:

```env
GOOGLE_API_KEY=TU_API_KEY_AQUI
```


## 4) Dependencias del extractor

Instalacion (una sola vez):

```powershell
cd "Extractor de datos"
python -m pip install google-genai pandas openpyxl pytz
```

## 5) Ejecucion del proyecto (orden recomendado)

Abrir terminales separadas para cada modulo.

### 5.1 Backend

```powershell
cd Backend
npm install
npm run dev
```

### 5.2 Simulacion

```powershell
cd Simulacion
npm install
npm run post-loop
```

### 5.3 Extractor de datos (API + Gemini + XLSX)

```powershell
cd "Extractor de datos"
python main.py --modo server --host 0.0.0.0 --port 8000
```

### 5.4 Frontend

```powershell
cd Frontend
python -m http.server 5500
```

Abrir en navegador:

- `http://localhost:5500/index.html`

## 6) Verificacion rapida de funcionamiento

1. En el dashboard deben actualizarse metricas (si simulacion y backend estan activos).
2. En la pestana **Identificacion**:
   - Subir imagen INE.
   - Clic en **Procesar con Gemini**.
   - Debe mostrar campos extraidos y estado de guardado.
3. Validar que exista nueva fila en:
   - `Extractor de datos/registros/check_in_maestro.xlsx`

Health check del extractor:

- `http://localhost:8000/health`

## 7) Endpoints relevantes

- Extractor:
  - `POST /extractor/procesar`
  - `GET /health`
- Backend:
  - Endpoints de dashboard/prediccion segun `Backend/src/routes`

## 8) Problemas comunes

### El extractor no arranca y procesa en batch

Verifica que lo iniciaste con:

```powershell
python main.py --modo server --host 0.0.0.0 --port 8000
```

### Error de API key

- Revisar `GOOGLE_API_KEY` en entorno o `.env`.
- Confirmar que la key sigue activa.

### El frontend no conecta con extractor

- Confirmar que `http://localhost:8000/health` responde.
- Verificar consola del navegador para errores de red.

## 9) Seguridad

- No exponer `GOOGLE_API_KEY` en commits.
- Mantener `.env` fuera de control de versiones.
