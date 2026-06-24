"""
routers/auth.py
Handles researcher login and JWT issuance.
"""
import jwt
from fastapi import APIRouter, HTTPException
from ..schemas import LoginSchema

router = APIRouter(prefix="/api", tags=["auth"])

SECRET_KEY   = "mi_clave_secreta_super_segura_"
_ADMIN_USER  = "admin"
_ADMIN_PASS  = "admin123"


@router.post("/login")
def login(credenciales: LoginSchema):
    if credenciales.username == _ADMIN_USER and credenciales.password == _ADMIN_PASS:
        token = jwt.encode({"sub": credenciales.username}, SECRET_KEY, algorithm="HS256")
        return {"status": "success", "token": token}
    raise HTTPException(status_code=401, detail="Error de login")
