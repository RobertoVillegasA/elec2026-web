# backend/routes/auth.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from db import verificar_usuario
from jose import jwt
from datetime import datetime, timedelta
import os
import logging

router = APIRouter()

# Configurar logging
logger = logging.getLogger(__name__)

# Configuración JWT - Usa la variable de entorno SECRET_KEY
SECRET_KEY = os.getenv('SECRET_KEY', 'elecciones2026-secreto-muy-seguro')
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
    try:
        logger.info(f"Login attempt for user: {login_data.username}")
        user = verificar_usuario(login_data.username, login_data.password)
        if not user:
            logger.warning(f"Login failed for user: {login_data.username}")
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

        logger.info(f"Login successful for user: {login_data.username}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")