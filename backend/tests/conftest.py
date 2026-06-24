"""
tests/conftest.py
Shared pytest fixtures.

Uses an in-memory SQLite engine so tests never touch the real PostgreSQL DB.
Each test gets its own transaction that is rolled back on teardown.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.database import Base, get_db
from backend.main import app
from backend import models  # noqa: F401  — registers ORM mappers


# ── Engine / Session factory ──────────────────────────────────────────────────

SQLALCHEMY_TEST_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def engine():
    """Create all tables once per test session in an in-memory SQLite DB."""
    eng = create_engine(
        SQLALCHEMY_TEST_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)
    eng.dispose()


@pytest.fixture()
def db(engine):
    """
    Per-test DB session.  Each test runs inside a SAVEPOINT so all writes
    are rolled back automatically, keeping tests fully isolated.
    """
    connection = engine.connect()
    transaction = connection.begin()

    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSession()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# ── FastAPI TestClient ─────────────────────────────────────────────────────────

@pytest.fixture()
def client(db):
    """
    TestClient with get_db overridden to use the per-test in-memory session.
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass  # rollback handled by the `db` fixture

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Seed helpers ──────────────────────────────────────────────────────────────

@pytest.fixture()
def prueba_fixture(db):
    """Creates and returns a single Prueba row."""
    from datetime import datetime
    prueba = models.Prueba(
        nombre_sistema="Sistema Test",
        descripcion_tarea="Tarea de prueba unitaria",
        usuarios_asignados=["usr_001"],
        metricas_seleccionadas={"accuracy": 0.85},
        token_version="tok_test",
        fecha_creacion=datetime(2025, 1, 15, 10, 0, 0),
    )
    db.add(prueba)
    db.commit()
    db.refresh(prueba)
    return prueba


@pytest.fixture()
def session_fixture(db, prueba_fixture):
    """
    Creates a full set of linked rows:
      EncuestaLog → LogObjetivo
    Returns (prueba, encuesta, log_objetivo).
    """
    from datetime import datetime

    encuesta = models.EncuestaLog(
        prueba_id=prueba_fixture.id,
        session_id="sess-abc-123",
        timestamp=datetime(2025, 1, 15, 11, 0, 0),
        respuestas={
            "p1": "a",   # confianza → 100
            "p2": "b",   # confianza → 75
            "p3": "c",   # confianza → 50
            "p4": "d",   # confianza → 25
            "p5": "a",   # explicabilidad → 100
            "p6": "b",   # explicabilidad → 75
            "nasa_1": 40,
            "nasa_2": 60,
        },
    )
    db.add(encuesta)
    db.commit()
    db.refresh(encuesta)

    log = models.LogObjetivo(
        prueba_id=prueba_fixture.id,
        session_id=encuesta.session_id,
        usuario_id="usr_001",
        tiempo_total=120.5,
        numero_clics=30,
        errores_cometidos=2,
        accuracy=0.80,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return prueba_fixture, encuesta, log
