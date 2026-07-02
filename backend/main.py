"""
main.py
Application entry point.  Registers middleware, routers, and triggers
table creation.  All business logic lives in the router modules.

Run with:
    uvicorn backend.main:app --reload
Swagger UI:
    http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base

# Import models so SQLAlchemy registers them before create_all()
from . import models  # noqa: F401

# Routers
from .routers import auth, pruebas, surveys, dashboard

# ── Create tables ─────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(title="HCAI Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ─────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(pruebas.router)
app.include_router(surveys.router)
app.include_router(dashboard.router)
