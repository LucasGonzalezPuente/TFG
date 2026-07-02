"""
schemas.py
Pydantic request/response schemas used by all routers.
"""
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime


class LoginSchema(BaseModel):
    username: str
    password: str


class PruebaSchema(BaseModel):
    nombre_sistema:   str
    descripcion_tarea: str
    metricas:         Dict[str, float]


class EventoSchema(BaseModel):
    event:      str
    user_id:    str
    session_id: Optional[str] = "default"
    timestamp:  datetime
    properties: Dict[str, Any]


class EncuestaSchema(BaseModel):
    respuestas: Dict[str, Any]
    session_id: str


class SubmissionPayload(BaseModel):
    session_id: str
    prueba_id:  int                  # FK → pruebas.id
    respuestas: Dict[str, Any]
    log_file:   List[EventoSchema]


class MetricasObjetivasSchema(BaseModel):
    session_id:        str
    prueba_id:         int
    usuario_id:        str
    tiempo_total:      float
    numero_clics:      int
    errores_cometidos: int
    accuracy:          Optional[float] = None
    precision:         Optional[float] = None
    recall:            Optional[float] = None
    f1_score:          Optional[float] = None
    auc_roc:           Optional[float] = None
    rmse:              Optional[float] = None
    mae:               Optional[float] = None
    r2:                Optional[float] = None
