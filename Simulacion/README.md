# Simulacion Hospitalaria SOLH

Modulo independiente para generar datos simulados del estado hospitalario en ciclos operativos. No requiere base de datos, backend ni dependencias externas.

## Instalacion local

1. Abre una terminal.
2. Ve a la carpeta del modulo:

```bash
cd C:\Users\luisl\Documents\SOLH\Simulacion
```

3. Instala el modulo localmente en otro proyecto (cuando se necesite):

```bash
npm install ..\Simulacion
```

## Pruebas

Desde la carpeta del modulo, ejecuta:

```bash
npm test
```

Esto corre `src/test/pruebaSimulacion.js`, que muestra:
- Estado inicial.
- 5 ciclos de simulacion normal.
- 5 ciclos en modo crisis.
- Reinicio de simulacion.

## Funciones exportadas

El modulo exporta desde `src/index.js`:

- `generarEstadoHospitalario(opciones = {})`
- `reiniciarSimulacion()`
- `obtenerEstadoActual()`

## Ejemplo de salida JSON

```json
{
  "area": "admision",
  "pacientes_espera": 14,
  "pacientes_atendidos": 11,
  "camas_totales": 50,
  "camas_ocupadas": 32,
  "camas_disponibles": 18,
  "personal_activo": 5,
  "nuevos_pacientes": 15,
  "pacientes_atendidos_ciclo": 11,
  "pacientes_con_cama": 3,
  "altas_ciclo": 1,
  "timestamp": "2026-04-17T20:00:00.000Z"
}
```

## Integracion posterior con Backend

Cuando se conecte con el Backend, se podra usar asi:

```js
const {
  generarEstadoHospitalario,
  reiniciarSimulacion,
  obtenerEstadoActual
} = require("simulacion-hospitalaria-solh");
```
