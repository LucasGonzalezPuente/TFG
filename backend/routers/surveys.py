"""
routers/surveys.py
Survey submission: persists subjective answers, raw events, and the
consolidated objective log in a single atomic transaction.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models   import Prueba, EncuestaLog, EventoLog, LogObjetivo
from ..schemas  import SubmissionPayload, MetricasObjetivasSchema

router = APIRouter(prefix="/api", tags=["surveys"])


@router.post("/submit-survey")
def guardar_encuesta_y_log(datos: SubmissionPayload, db: Session = Depends(get_db)):
    # Verify the experiment exists
    prueba = db.query(Prueba).filter(Prueba.id == datos.prueba_id).first()
    if not prueba:
        raise HTTPException(status_code=404, detail="Prueba no encontrada")

    # Persist subjective survey
    nueva_encuesta = EncuestaLog(
        prueba_id  = prueba.id,
        session_id = datos.session_id,
        respuestas = datos.respuestas,
    )
    db.add(nueva_encuesta)
    db.flush()   # make session_id available as FK before inserting events

    # Persist raw events
    total_errores    = 0
    for evento in datos.log_file:
        db.add(EventoLog(
            session_id = datos.session_id,
            user_id    = evento.user_id,
            event_type = evento.event,
            timestamp  = evento.timestamp,
            properties = evento.properties,
        ))
        total_errores += evento.properties.get("errors", 0)

    num_eventos = len(datos.log_file)
    if num_eventos > 0:
        tiempo_total_sec = (datos.log_file[-1].timestamp - datos.log_file[0].timestamp).total_seconds()
    else:
        tiempo_total_sec = 0

    # Persist consolidated objective log
    accuracy_calculada = (
        max(0.0, 1.0 - (total_errores / num_eventos))
        if num_eventos > 0 else 0.0
    )
    db.add(LogObjetivo(
        session_id        = datos.session_id,
        prueba_id         = prueba.id,
        usuario_id        = datos.log_file[0].user_id if datos.log_file else "unknown",
        tiempo_total      = tiempo_total_sec,
        numero_clics      = num_eventos,
        errores_cometidos = total_errores,
        accuracy          = accuracy_calculada,
    ))

    db.commit()
    return {"status": "success", "message": "Encuesta y logs procesados correctamente"}


@router.post("/submit-metrics")
def guardar_metricas(datos: MetricasObjetivasSchema, db: Session = Depends(get_db)):
    """Endpoint for external systems to push pre-computed objective metrics."""
    db.add(LogObjetivo(**datos.dict()))
    db.commit()
    return {"status": "success"}
