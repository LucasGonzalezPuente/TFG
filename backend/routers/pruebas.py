"""
routers/pruebas.py
Experiment (prueba) creation, listing, and A/B comparison.
"""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models   import Prueba, LogObjetivo, EncuestaLog
from ..schemas  import PruebaSchema
from ..hcai_logic import calcular_score_hcai

router = APIRouter(prefix="/api", tags=["pruebas"])


@router.post("/crear-prueba")
def crear_prueba(datos: PruebaSchema, db: Session = Depends(get_db)):
    token = str(uuid.uuid4())[:8]
    nueva = Prueba(
        nombre_sistema         = datos.nombre_sistema,
        descripcion_tarea      = datos.descripcion_tarea,
        metricas_seleccionadas = datos.metricas,
        token_version          = token,
    )
    db.add(nueva)
    db.commit()
    return {
        "status":        "success",
        "token_version": token,
        "nombre_sistema": datos.nombre_sistema,
        "link_generado": f"http://localhost:3000/test/{token}",
    }


@router.get("/pruebas-realizadas")
def listar_pruebas(db: Session = Depends(get_db)):
    pruebas = db.query(Prueba).all()
    return [
        {
            "id":               p.id,
            "nombre_sistema":   p.nombre_sistema,
            "descripcion_tarea": p.descripcion_tarea,
            "token_version":    p.token_version,
            "fecha_creacion":   p.fecha_creacion.isoformat() if p.fecha_creacion else None,
        }
        for p in pruebas
    ]



@router.get("/compare-tests/{token_a}/{token_b}")
def compare_tests(token_a: str, token_b: str, db: Session = Depends(get_db)):
    def get_summary(token: str) -> dict:
        prueba = db.query(Prueba).filter(Prueba.token_version == token).first()
        if not prueba:
            return {"accuracy": 0, "tiempo": 0, "confianza": 0, "nombre": token}

        logs = db.query(LogObjetivo).filter(LogObjetivo.prueba_id == prueba.id).all()
        if not logs:
            return {"accuracy": 0, "tiempo": 0, "confianza": 0, "nombre": prueba.nombre_sistema}

        session_ids = [l.session_id for l in logs]
        encuestas   = db.query(EncuestaLog).filter(EncuestaLog.session_id.in_(session_ids)).all()
        avg_acc     = sum(l.accuracy  or 0 for l in logs)     / len(logs)
        avg_time    = sum(l.tiempo_total or 0 for l in logs)  / len(logs)
        subjetivos  = [calcular_score_hcai(e.respuestas) for e in encuestas]
        avg_conf    = sum(s["conf"] for s in subjetivos) / len(subjetivos) if subjetivos else 0

        return {
            "nombre":   prueba.nombre_sistema,
            "accuracy": round(avg_acc  * 100, 1),
            "tiempo":   round(avg_time,       2),
            "confianza":round(avg_conf,        1),
        }

    a, b = get_summary(token_a), get_summary(token_b)
    return [
        {"nombre": "Accuracy (%)",  "sistemaA": a["accuracy"],  "sistemaB": b["accuracy"]},
        {"nombre": "Confianza",     "sistemaA": a["confianza"], "sistemaB": b["confianza"]},
        {"nombre": "Tiempo (s)",    "sistemaA": a["tiempo"],    "sistemaB": b["tiempo"]},
    ]
