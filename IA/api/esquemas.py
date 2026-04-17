"""
api/esquemas.py
Define los modelos de datos de entrada y salida del endpoint /ia/predecir.
"""

from typing import Any, Dict, Optional
from dataclasses import dataclass, asdict


@dataclass
class DatosHospitalEntrada:
    """Payload que recibe el endpoint POST /ia/predecir."""
    camas_totales:         int
    camas_ocupadas:        int
    personal_total:        int
    personal_activo:       int
    quirofanos_totales:    int
    quirofanos_activos:    int
    pacientes_urgencias:   int
    tiempo_espera_min:     float
    ingresos_ultima_hora:  int
    altas_ultima_hora:     int
    hora_del_dia:          int
    timestamp:             Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "DatosHospitalEntrada":
        campos = {k: v for k, v in d.items() if k in cls.__dataclass_fields__}
        return cls(**campos)


@dataclass
class PrediccionSalida:
    """Payload que retorna el endpoint POST /ia/predecir."""
    timestamp:              str
    ventana_prediccion_min: int
    estado_actual:          Dict[str, Any]
    prediccion:             Dict[str, Any]
    fuente:                 str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)