"""
routers/dashboard.py
Aggregated metrics endpoint consumed by the React Dashboard.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from ..database   import get_db
from ..models     import Prueba, EncuestaLog, LogObjetivo, EventoLog
from ..hcai_logic import calcular_score_hcai

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard-metrics")
def get_metrics(prueba_id: int = None, db: Session = Depends(get_db)):
    if prueba_id is None:
        prueba = db.query(Prueba).order_by(desc(Prueba.id)).first()
        if not prueba:
            return {"total_usuarios": 0, "detalles_individuales": []}
        prueba_id = prueba.id
    else:
        prueba = db.query(Prueba).filter(Prueba.id == prueba_id).first()
        if not prueba:
            return {"total_usuarios": 0, "detalles_individuales": []}

    logs_resumen  = db.query(LogObjetivo).filter(LogObjetivo.prueba_id == prueba_id).all()
    encuestas     = db.query(EncuestaLog).filter(EncuestaLog.prueba_id == prueba_id).all()

    if not encuestas or not logs_resumen:
        return {
            "total_usuarios": 0,
            "sistema_evaluado": prueba.nombre_sistema,
            "detalles_individuales": []
        }

    dict_logs = {l.session_id: l for l in logs_resumen}

    detalles = []
    for enc in encuestas:
        if enc.session_id not in dict_logs:
            continue
        log  = dict_logs[enc.session_id]
        hcai = calcular_score_hcai(enc.respuestas)
        detalles.append({
            "session_id":        enc.session_id,
            "fecha":             enc.timestamp.strftime("%d/%m/%Y %H:%M") if enc.timestamp else "",
            "confianza":         hcai["conf"],
            "explicabilidad":    hcai["expl"],
            "carga_cognitiva":   hcai["cogn"],
            "tiempo":            log.tiempo_total,
            "errores_detectados": log.errores_cometidos,
            "accuracy":          round(log.accuracy * 100, 1) if log.accuracy else 0,
        })

    n = len(detalles)
    if n == 0:
        return {
            "total_usuarios": 0,
            "sistema_evaluado": prueba.nombre_sistema,
            "detalles_individuales": []
        }

    return {
        "total_usuarios":   n,
        "sistema_evaluado": prueba.nombre_sistema,
        "subjetivo": {
            "confianza":       round(sum(d["confianza"]       for d in detalles) / n, 2),
            "explicabilidad":  round(sum(d["explicabilidad"]  for d in detalles) / n, 2),
            "carga_cognitiva": round(sum(d["carga_cognitiva"] for d in detalles) / n, 2),
        },
        "objetivo": {
            "tiempo_medio":             round(sum(d["tiempo"]   for d in detalles) / n, 2),
            "accuracy_real_promedio":   round(sum(d["accuracy"] for d in detalles) / n, 2),
        },
        "evaluador": {
            "accuracy_esperado": (
                float(prueba.metricas_seleccionadas.get("accuracy", 0)) * 100
                if (prueba.metricas_seleccionadas and isinstance(prueba.metricas_seleccionadas, dict)) else 0
            ),
        },
        "detalles_individuales": detalles,
    }


@router.get("/log-metrics")
def get_log_metrics(prueba_id: int = None, db: Session = Depends(get_db)):
    if prueba_id is None:
        prueba = db.query(Prueba).order_by(desc(Prueba.id)).first()
        if not prueba:
            return None
        prueba_id = prueba.id
    else:
        prueba = db.query(Prueba).filter(Prueba.id == prueba_id).first()
        if not prueba:
            return None

    logs = db.query(LogObjetivo).filter(LogObjetivo.prueba_id == prueba_id).all()
    if not logs:
        return {
            "resumen_objetivo": {
                "total_interacciones": 0,
                "total_errores": 0,
                "tiempo_medio_s": 0,
                "tasa_error_media": "0%",
            },
            "distribucion_eventos": [],
            "errores_por_sesion": [],
            "tiempo_por_sesion": [],
            "metricas_evaluador": {},
        }

    total_interacciones = sum(l.numero_clics or 0 for l in logs)
    total_errores = sum(l.errores_cometidos or 0 for l in logs)
    tiempo_medio_s = round(sum(l.tiempo_total or 0 for l in logs) / len(logs), 2) if logs else 0
    tasa_val = round((total_errores / total_interacciones) * 100, 1) if total_interacciones > 0 else 0
    tasa_error_media = f"{tasa_val}%"

    # Event distribution
    eventos_query = db.query(
        EventoLog.event_type,
        func.count(EventoLog.id).label("count")
    ).join(
        EncuestaLog, EventoLog.session_id == EncuestaLog.session_id
    ).filter(
        EncuestaLog.prueba_id == prueba_id
    ).group_by(EventoLog.event_type).all()

    distribucion_eventos = [
        {"evento": row[0] or "unknown", "count": row[1]} for row in eventos_query
    ]

    # Errores por sesion
    errores_por_sesion = [
        {
            "session": l.session_id[-8:] if l.session_id else "unknown",
            "clics": l.numero_clics or 0,
            "errores": l.errores_cometidos or 0,
        }
        for l in logs
    ]

    # Tiempo por sesion
    tiempo_por_sesion = [
        {
            "tiempo_s": l.tiempo_total or 0,
            "accuracy": round((l.accuracy or 0) * 100, 1),
        }
        for l in logs
    ]

    # Metricas evaluador
    metricas_evaluador = {}
    if prueba.metricas_seleccionadas and isinstance(prueba.metricas_seleccionadas, dict):
        for k, v in prueba.metricas_seleccionadas.items():
            if v is not None:
                if k in ["rmse", "mae", "mape"]:
                    metricas_evaluador[k] = v
                else:
                    metricas_evaluador[k] = round(v * 100, 1)

    return {
        "resumen_objetivo": {
            "total_interacciones": total_interacciones,
            "total_errores": total_errores,
            "tiempo_medio_s": tiempo_medio_s,
            "tasa_error_media": tasa_error_media,
        },
        "distribucion_eventos": distribucion_eventos,
        "errores_por_sesion": errores_por_sesion,
        "tiempo_por_sesion": tiempo_por_sesion,
        "metricas_evaluador": metricas_evaluador,
    }
