"""
routers/logs.py
Raw event ingestion from external systems under test.
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models   import EventoLog
from ..schemas  import EventoSchema

router = APIRouter(prefix="/api", tags=["logs"])


@router.post("/ingest-logs")
def ingestar_logs(eventos: List[EventoSchema], db: Session = Depends(get_db)):
    for e in eventos:
        db.add(EventoLog(
            user_id    = e.user_id,
            session_id = e.session_id,
            event_type = e.event,
            timestamp  = e.timestamp,
            properties = e.properties,
        ))
    db.commit()
    return {"status": "logs_processed", "count": len(eventos)}
