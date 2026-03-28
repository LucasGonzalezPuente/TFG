from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime, Float, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from typing import Dict, Any, List, Optional 
import uuid
import jwt

# --- 1. CONFIGURACIÓN DE BASE DE DATOS ---
DATABASE_URL = "postgresql://postgres:root@localhost/hcai_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. MODELOS ---
class EncuestaLog(Base):
    __tablename__ = "encuestas"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    respuestas = Column(JSON) 

class Prueba(Base):
    __tablename__ = "pruebas"
    id = Column(Integer, primary_key=True, index=True)
    nombre_sistema = Column(String)
    descripcion_tarea = Column(String)
    usuarios_asignados = Column(JSON)
    metricas_seleccionadas = Column(JSON)
    token_version = Column(String, unique=True, index=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

class LogObjetivo(Base):
    __tablename__ = "logs_objetivos"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    prueba_id = Column(String)
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
    prueba_id: str
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
        if key.startswith("p"):
            val = SCALES.get(value, 50)
            if key in ["p1_confianza", "p2_predecible", "p3_fiabilidad", "p4_seguridad"]:
                scores["confianza"].append(val)
            else:
                scores["explicabilidad"].append(val)
        elif key.startswith("nasa"):
            try:
                scores["carga_cognitiva"].append(100 - int(value))
            except: pass
    avg = lambda l: sum(l) / len(l) if l else 0
    return {
        "conf": avg(scores["confianza"]),
        "expl": avg(scores["explicabilidad"]),
        "cogn": avg(scores["carga_cognitiva"])
    }

# --- 6. ENDPOINTS ---

@app.post("/api/login")
def login(credenciales: LoginSchema):
    if credenciales.username == "admin" and credenciales.password == "admin123":
        token = jwt.encode({"sub": credenciales.username}, SECRET_KEY, algorithm="HS256")
        return {"status": "success", "token": token}
    raise HTTPException(status_code=401, detail="Error de login")

@app.post("/api/submit-survey")
def guardar_encuesta(datos: EncuestaSchema, db: Session = Depends(get_db)):
    db.add(EncuestaLog(session_id=datos.session_id, respuestas=datos.respuestas))
    db.commit()
    return {"status": "success"}

@app.post("/api/submit-metrics")
def guardar_metricas(datos: MetricasObjetivasSchema, db: Session = Depends(get_db)):
    nuevo_log = LogObjetivo(**datos.dict())
    db.add(nuevo_log)
    db.commit()
    return {"status": "success"}

@app.get("/api/dashboard-metrics")
def get_metrics(db: Session = Depends(get_db)):
    # Obtenemos TODO de la base de datos
    encuestas = db.query(EncuestaLog).order_by(desc(EncuestaLog.timestamp)).all()
    logs_tecnicos = db.query(LogObjetivo).all()
    ultima_prueba = db.query(Prueba).order_by(desc(Prueba.id)).first()

    if not encuestas:
        return {"total_usuarios": 0, "detalles_individuales": []}

    detalles = []
    sum_conf = sum_expl = sum_cogn = sum_t = sum_c = sum_acc = 0

    for enc in encuestas:
        hcai = calcular_score_hcai(enc.respuestas)
        log = next((l for l in logs_tecnicos if l.session_id == enc.session_id), None)
        
        # Datos individuales
        item = {
            "session_id": enc.session_id,
            "fecha": enc.timestamp.strftime("%d/%m/%Y %H:%M"),
            "confianza": round(hcai["conf"], 1),
            "explicabilidad": round(hcai["expl"], 1),
            "carga_cognitiva": round(hcai["cogn"], 1),
            "tiempo": log.tiempo_total if log else 0,
            "clics": log.numero_clics if log else 0,
            "accuracy": round((log.accuracy or 0) * 100, 1) if log else 0
        }
        detalles.append(item)
        
        # Acumular para promedios
        sum_conf += item["confianza"]
        sum_expl += item["explicabilidad"]
        sum_cogn += item["carga_cognitiva"]
        sum_t += item["tiempo"]
        sum_c += item["clics"]
        sum_acc += item["accuracy"]

    n = len(encuestas)
    gt_acc = float(ultima_prueba.metricas_seleccionadas.get("accuracy", 0)) * 100 if ultima_prueba else 0

    return {
        "total_usuarios": n,
        "sistema_evaluado": ultima_prueba.nombre_sistema if ultima_prueba else "N/A",
        "subjetivo": {
            "confianza": round(sum_conf / n, 2),
            "explicabilidad": round(sum_expl / n, 2),
            "carga_cognitiva": round(sum_cogn / n, 2)
        },
        "objetivo": {
            "tiempo_medio": round(sum_t / n, 2),
            "clics_medio": round(sum_c / n, 1),
            "accuracy_real_promedio": round(sum_acc / n, 2)
        },
        "evaluador": {"accuracy_esperado": gt_acc},
        "detalles_individuales": detalles
    }

@app.get("/api/usuarios-disponibles")
def get_users():
    return [{"id": "usr_001", "nombre": "Ana"}, {"id": "usr_002", "nombre": "Carlos"}]



@app.get("/api/pruebas-realizadas")
def listar_pruebas(db: Session = Depends(get_db)):
    """Añadido para que el Dashboard pueda llenar los selectores"""
    return db.query(Prueba).all()

@app.get("/api/compare-tests/{token_a}/{token_b}")
def compare_tests(token_a: str, token_b: str, db: Session = Depends(get_db)):
    def get_summary(token):
        logs = db.query(LogObjetivo).filter(LogObjetivo.prueba_id == token).all()
        if not logs: return {"accuracy": 0, "tiempo": 0, "confianza": 0, "nombre": token}
        
        session_ids = [l.session_id for l in logs]
        encuestas = db.query(EncuestaLog).filter(EncuestaLog.session_id.in_(session_ids)).all()
        
        avg_acc = sum(l.accuracy or 0 for l in logs) / len(logs)
        avg_time = sum(l.tiempo_total or 0 for l in logs) / len(logs)
        
        subjetivos = [calcular_score_hcai(e.respuestas) for e in encuestas]
        avg_conf = sum(s["conf"] for s in subjetivos) / len(subjetivos) if subjetivos else 0
        
        prueba_info = db.query(Prueba).filter(Prueba.token_version == token).first()
        return {
            "nombre": prueba_info.nombre_sistema if prueba_info else token,
            "accuracy": round(avg_acc * 100, 1),
            "tiempo": round(avg_time, 2),
            "confianza": round(avg_conf, 1)
        }

    a = get_summary(token_a)
    b = get_summary(token_b)

    # REESTRUCTURADO PARA RECHARTS:
    return [
        {"nombre": "Accuracy (%)", "sistemaA": a["accuracy"], "sistemaB": b["accuracy"]},
        {"nombre": "Confianza", "sistemaA": a["confianza"], "sistemaB": b["confianza"]},
        {"nombre": "Tiempo (s)", "sistemaA": a["tiempo"], "sistemaB": b["tiempo"]}
    ]

@app.post("/api/crear-prueba")
def crear_prueba(datos: PruebaSchema, db: Session = Depends(get_db)):
    token = str(uuid.uuid4())[:8]
    # CORRECCIÓN: Mapeo explícito de campos para evitar error de nombres
    nueva = Prueba(
        nombre_sistema=datos.nombre_sistema,
        descripcion_tarea=datos.descripcion_tarea,
        usuarios_asignados=datos.usuarios,
        metricas_seleccionadas=datos.metricas,
        token_version=token
    )
    db.add(nueva)
    db.commit()
    return {"status": "success", "version_token": token, "link_generado": f"http://localhost:3000/test/{token}"}