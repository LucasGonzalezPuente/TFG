from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime, Float, desc, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from typing import Dict, Any, List, Optional 
import uuid
import jwt

# Swagger --> http://localhost:8000/docs

# --- 1. CONFIGURACIÓN DE BASE DE DATOS ---
DATABASE_URL = "postgresql://postgres:root@localhost/hcai_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. MODELOS ---

# Prueba se define primero porque el resto la referencian
class Prueba(Base):
    __tablename__ = "pruebas"
    id = Column(Integer, primary_key=True, index=True)
    nombre_sistema = Column(String)
    descripcion_tarea = Column(String)
    usuarios_asignados = Column(JSON)
    metricas_seleccionadas = Column(JSON)
    token_version = Column(String, unique=True, index=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

class EncuestaLog(Base):
    __tablename__ = "encuestas"
    id = Column(Integer, primary_key=True, index=True)
    # FK → pruebas.id: cada encuesta pertenece a una prueba concreta
    prueba_id = Column(Integer, ForeignKey("pruebas.id"), nullable=False)
    # session_id único: es la clave de vinculación con eventos_raw y logs_objetivos
    session_id = Column(String, unique=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    respuestas = Column(JSON)

class EventoLog(Base):
    __tablename__ = "eventos_raw"
    id = Column(Integer, primary_key=True, index=True)
    # FK → encuestas.session_id: cada evento pertenece a una sesión de encuesta
    session_id = Column(String, ForeignKey("encuestas.session_id"), nullable=False)
    user_id = Column(String)
    event_type = Column(String)
    timestamp = Column(DateTime)
    properties = Column(JSON)

class LogObjetivo(Base):
    __tablename__ = "logs_objetivos"
    id = Column(Integer, primary_key=True, index=True)
    # FK → encuestas.session_id: el registro objetivo se vincula a su encuesta
    session_id = Column(String, ForeignKey("encuestas.session_id"), nullable=False)
    # FK → pruebas.id: permite saber a qué experimento pertenece este log
    prueba_id = Column(Integer, ForeignKey("pruebas.id"), nullable=False)
    usuario_id = Column(String)
    tiempo_total = Column(Float)
    numero_clics = Column(Integer)
    errores_cometidos = Column(Integer)
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    auc_roc = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)
    r2 = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# --- 3. ESQUEMAS ---
class EncuestaSchema(BaseModel):
    respuestas: Dict[str, Any]
    session_id: str

class PruebaSchema(BaseModel):
    nombre_sistema: str
    descripcion_tarea: str
    usuarios: List[str]
    metricas: Dict[str, float]

class MetricasObjetivasSchema(BaseModel):
    session_id: str
    prueba_id: int          # FK → pruebas.id
    usuario_id: str
    tiempo_total: float
    numero_clics: int
    errores_cometidos: int
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    auc_roc: Optional[float] = None
    rmse: Optional[float] = None
    mae: Optional[float] = None
    mape: Optional[float] = None
    r2: Optional[float] = None

class LoginSchema(BaseModel):
    username: str
    password: str

class EventoSchema(BaseModel):
    event: str
    user_id: str
    session_id: Optional[str] = "default"
    timestamp: datetime
    properties: Dict[str, Any]

class SubmissionPayload(BaseModel):
    session_id: str
    prueba_id: int          # FK → pruebas.id (antes era el token string)
    respuestas: Dict[str, Any]
    log_file: List[EventoSchema]

# --- 4. CONFIGURACIÓN APP ---
SECRET_KEY = "mi_clave_secreta_super_segura_"
app = FastAPI(title="HCAI Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 5. LÓGICA HCAI ---
SCALES = {"a": 100, "b": 75, "c": 50, "d": 25, "e": 0}

def calcular_score_hcai(respuestas):
    scores = {"confianza": [], "explicabilidad": [], "carga_cognitiva": []}
    for key, value in respuestas.items():
        if key.startswith("nasa"):
            try:
                scores["carga_cognitiva"].append(int(value))
            except:
                pass
        elif key.startswith("p"):
            val = SCALES.get(value, 50)
            # p1–p4 → confianza, p5–p15 → explicabilidad
            try:
                num = int(key.split("_")[0][1:])
                if num <= 4:
                    scores["confianza"].append(val)
                else:
                    scores["explicabilidad"].append(val)
            except:
                scores["explicabilidad"].append(val)

    avg = lambda l: sum(l) / len(l) if l else 0
    return {
        "conf": round(avg(scores["confianza"]), 1),
        "expl": round(avg(scores["explicabilidad"]), 1),
        "cogn": round(avg(scores["carga_cognitiva"]), 1)
    }

# --- 6. ENDPOINTS ---

@app.post("/api/login")
def login(credenciales: LoginSchema):
    if credenciales.username == "admin" and credenciales.password == "admin123":
        token = jwt.encode({"sub": credenciales.username}, SECRET_KEY, algorithm="HS256")
        return {"status": "success", "token": token}
    raise HTTPException(status_code=401, detail="Error de login")

@app.post("/api/submit-survey")
def guardar_encuesta_y_log(datos: SubmissionPayload, db: Session = Depends(get_db)):
    # 0. Verificar que la prueba existe (integridad referencial explícita)
    prueba = db.query(Prueba).filter(Prueba.id == datos.prueba_id).first()
    if not prueba:
        raise HTTPException(status_code=404, detail="Prueba no encontrada")

    # 1. Guardar la encuesta (datos subjetivos) con FK a pruebas
    nueva_encuesta = EncuestaLog(
        prueba_id=prueba.id,
        session_id=datos.session_id,
        respuestas=datos.respuestas
    )
    db.add(nueva_encuesta)
    db.flush()  # necesario para que session_id quede disponible como FK

    # 2. Procesar los logs recibidos con FK a encuestas.session_id
    total_errores = 0
    tiempo_total_ms = 0
    num_eventos = len(datos.log_file)

    for evento in datos.log_file:
        nuevo_evento = EventoLog(
            session_id=datos.session_id,
            user_id=evento.user_id,
            event_type=evento.event,
            timestamp=evento.timestamp,
            properties=evento.properties
        )
        db.add(nuevo_evento)
        total_errores += evento.properties.get("errors", 0)
        tiempo_total_ms += evento.properties.get("time_to_complete", 0)

    # 3. Crear el registro objetivo consolidado con FK a pruebas y encuestas
    accuracy_calculada = max(0.0, 1.0 - (total_errores / num_eventos)) if num_eventos > 0 else 0.0

    metricas_obj = LogObjetivo(
        session_id=datos.session_id,
        prueba_id=prueba.id,
        usuario_id=datos.log_file[0].user_id if datos.log_file else "unknown",
        tiempo_total=tiempo_total_ms / 1000,
        numero_clics=num_eventos,
        errores_cometidos=total_errores,
        accuracy=accuracy_calculada
    )
    db.add(metricas_obj)
    db.commit()
    return {"status": "success", "message": "Encuesta y logs procesados correctamente"}

@app.post("/api/submit-metrics")
def guardar_metricas(datos: MetricasObjetivasSchema, db: Session = Depends(get_db)):
    nuevo_log = LogObjetivo(**datos.dict())
    db.add(nuevo_log)
    db.commit()
    return {"status": "success"}

@app.post("/api/ingest-logs")
def ingestar_logs(eventos: List[EventoSchema], db: Session = Depends(get_db)):
    for e in eventos:
        nuevo_evento = EventoLog(
            user_id=e.user_id,
            session_id=e.session_id,
            event_type=e.event,
            timestamp=e.timestamp,
            properties=e.properties
        )
        db.add(nuevo_evento)
    db.commit()
    return {"status": "logs_processed", "count": len(eventos)}

@app.get("/api/dashboard-metrics")
def get_metrics(db: Session = Depends(get_db)):
    logs_resumen = db.query(LogObjetivo).all()
    encuestas = db.query(EncuestaLog).all()
    ultima_prueba = db.query(Prueba).order_by(desc(Prueba.id)).first()

    if not encuestas or not logs_resumen:
        return {"total_usuarios": 0, "detalles_individuales": []}

    dict_logs = {l.session_id: l for l in logs_resumen}
    
    detalles = []
    for enc in encuestas:
        if enc.session_id in dict_logs:
            log = dict_logs[enc.session_id]
            hcai = calcular_score_hcai(enc.respuestas)
            detalles.append({
                "session_id": enc.session_id,
                "fecha": enc.timestamp.strftime("%d/%m/%Y %H:%M"),
                "confianza": hcai["conf"],
                "explicabilidad": hcai["expl"],
                "carga_cognitiva": hcai["cogn"],
                "tiempo": log.tiempo_total,
                "errores_detectados": log.errores_cometidos,
                "accuracy": round(log.accuracy * 100, 1) if log.accuracy else 0
            })

    n = len(detalles)
    if n == 0:
        return {"total_usuarios": 0, "detalles_individuales": []}

    return {
        "total_usuarios": n,
        "sistema_evaluado": ultima_prueba.nombre_sistema if ultima_prueba else "Sistema Genérico",
        "subjetivo": {
            "confianza": round(sum(d["confianza"] for d in detalles) / n, 2),
            "explicabilidad": round(sum(d["explicabilidad"] for d in detalles) / n, 2),
            "carga_cognitiva": round(sum(d["carga_cognitiva"] for d in detalles) / n, 2)
        },
        "objetivo": {
            "tiempo_medio": round(sum(d["tiempo"] for d in detalles) / n, 2),
            "accuracy_real_promedio": round(sum(d["accuracy"] for d in detalles) / n, 2)
        },
        "evaluador": {
            "accuracy_esperado": float(ultima_prueba.metricas_seleccionadas.get("accuracy", 0)) * 100 if ultima_prueba else 0
        },
        "detalles_individuales": detalles
    }

@app.get("/api/usuarios-disponibles")
def get_users():
    return [{"id": "usr_001", "nombre": "Ana"}, {"id": "usr_002", "nombre": "Carlos"}]

# FIX: Serializar objetos ORM a dict para evitar error 500
@app.get("/api/pruebas-realizadas")
def listar_pruebas(db: Session = Depends(get_db)):
    pruebas = db.query(Prueba).all()
    return [
        {
            "id": p.id,                          # FK numérica que usará el frontend
            "nombre_sistema": p.nombre_sistema,
            "descripcion_tarea": p.descripcion_tarea,
            "token_version": p.token_version,
            "fecha_creacion": p.fecha_creacion.isoformat() if p.fecha_creacion else None
        }
        for p in pruebas
    ]

@app.get("/api/compare-tests/{token_a}/{token_b}")
def compare_tests(token_a: str, token_b: str, db: Session = Depends(get_db)):
    def get_summary(token):
        prueba_info = db.query(Prueba).filter(Prueba.token_version == token).first()
        if not prueba_info:
            return {"accuracy": 0, "tiempo": 0, "confianza": 0, "nombre": token}
        # Filtrar logs por prueba_id entero (FK real)
        logs = db.query(LogObjetivo).filter(LogObjetivo.prueba_id == prueba_info.id).all()
        if not logs:
            return {"accuracy": 0, "tiempo": 0, "confianza": 0, "nombre": prueba_info.nombre_sistema}
        session_ids = [l.session_id for l in logs]
        encuestas = db.query(EncuestaLog).filter(EncuestaLog.session_id.in_(session_ids)).all()
        avg_acc = sum(l.accuracy or 0 for l in logs) / len(logs)
        avg_time = sum(l.tiempo_total or 0 for l in logs) / len(logs)
        subjetivos = [calcular_score_hcai(e.respuestas) for e in encuestas]
        avg_conf = sum(s["conf"] for s in subjetivos) / len(subjetivos) if subjetivos else 0
        return {
            "nombre": prueba_info.nombre_sistema,
            "accuracy": round(avg_acc * 100, 1),
            "tiempo": round(avg_time, 2),
            "confianza": round(avg_conf, 1)
        }

    a = get_summary(token_a)
    b = get_summary(token_b)
    return [
        {"nombre": "Accuracy (%)", "sistemaA": a["accuracy"], "sistemaB": b["accuracy"]},
        {"nombre": "Confianza",    "sistemaA": a["confianza"], "sistemaB": b["confianza"]},
        {"nombre": "Tiempo (s)",   "sistemaA": a["tiempo"],   "sistemaB": b["tiempo"]}
    ]

@app.post("/api/crear-prueba")
def crear_prueba(datos: PruebaSchema, db: Session = Depends(get_db)):
    token = str(uuid.uuid4())[:8]
    nueva = Prueba(
        nombre_sistema=datos.nombre_sistema,
        descripcion_tarea=datos.descripcion_tarea,
        usuarios_asignados=datos.usuarios,
        metricas_seleccionadas=datos.metricas,
        token_version=token
    )
    db.add(nueva)
    db.commit()
    # FIX: clave unificada como "token_version" (coherente con el frontend)
    return {
        "status": "success",
        "token_version": token,
        "nombre_sistema": datos.nombre_sistema,
        "link_generado": f"http://localhost:3000/test/{token}"
    }