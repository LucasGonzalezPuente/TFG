"""
models.py
SQLAlchemy ORM models.  All tables are created via Base.metadata.create_all()
called in main.py after all models have been imported.
"""
from sqlalchemy import Column, Integer, String, JSON, DateTime, Float, ForeignKey
from datetime import datetime
from .database import Base


class Prueba(Base):
    """An experiment version configured by the evaluator."""
    __tablename__ = "pruebas"

    id                    = Column(Integer, primary_key=True, index=True)
    nombre_sistema        = Column(String)
    descripcion_tarea     = Column(String)
    metricas_seleccionadas = Column(JSON)
    token_version         = Column(String, unique=True, index=True)
    fecha_creacion        = Column(DateTime, default=datetime.utcnow)


class EncuestaLog(Base):
    """Subjective survey responses submitted by a participant."""
    __tablename__ = "encuestas"

    id         = Column(Integer, primary_key=True, index=True)
    prueba_id  = Column(Integer, ForeignKey("pruebas.id"), nullable=False)
    session_id = Column(String, unique=True, index=True)
    timestamp  = Column(DateTime, default=datetime.utcnow)
    respuestas = Column(JSON)


class EventoLog(Base):
    """Raw interaction event emitted by the system under test."""
    __tablename__ = "eventos_raw"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("encuestas.session_id"), nullable=False)
    user_id    = Column(String)
    event_type = Column(String)
    timestamp  = Column(DateTime)
    properties = Column(JSON)


class LogObjetivo(Base):
    """Consolidated objective metrics derived from raw events for one session."""
    __tablename__ = "logs_objetivos"

    id                 = Column(Integer, primary_key=True, index=True)
    session_id         = Column(String, ForeignKey("encuestas.session_id"), nullable=False)
    prueba_id          = Column(Integer, ForeignKey("pruebas.id"), nullable=False)
    usuario_id         = Column(String)
    tiempo_total       = Column(Float)
    numero_clics       = Column(Integer)
    errores_cometidos  = Column(Integer)
    # AI metrics (optional — filled from ground-truth or computed from log)
    accuracy           = Column(Float, nullable=True)
    precision          = Column(Float, nullable=True)
    recall             = Column(Float, nullable=True)
    f1_score           = Column(Float, nullable=True)
    auc_roc            = Column(Float, nullable=True)
    rmse               = Column(Float, nullable=True)
    mae                = Column(Float, nullable=True)
    r2                 = Column(Float, nullable=True)
    timestamp          = Column(DateTime, default=datetime.utcnow)
