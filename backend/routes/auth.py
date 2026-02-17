# backend/routes/auth.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from db import verificar_usuario
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter()

# Configuración JWT (ajusta SECRET_KEY en producción)
SECRET_KEY = "elecciones2026-secreto-muy-seguro"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 horas

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest):
    user = verificar_usuario(login_data.username, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    # Crear token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "user_id": user["id_usuario"]},
        expires_delta=access_token_expires
    )
    
    # Devolver token y datos del usuario (sin el hash)
    user_response = {
        "id_usuario": user["id_usuario"],
        "username": user["username"],
        "fullname": user["fullname"],
        "nombre_rol": user["nombre_rol"]
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }