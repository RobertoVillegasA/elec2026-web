# backend/security.py
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from db import get_db_connection
import os

# Configuración de JWT
SECRET_KEY = os.getenv("SECRET_KEY", "elec2026_secret_key_fallback")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 horas

security = HTTPBearer()

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Credenciales no válidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Buscar usuario en BD
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id_usuario, username, fullname, r.nombre_rol FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.id_usuario = %s",
            (user_id,)
        )
        user = cursor.fetchone()
        if user is None:
            raise credentials_exception
        return user
    finally:
        cursor.close()
        conn.close()