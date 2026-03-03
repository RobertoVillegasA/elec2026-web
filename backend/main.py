# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from routes.catalog import router as catalog_router
from routes.escrutinio import router as escrutinio_router
from routes.auth import router as auth_router
# from routes.actas import router as actas_router  # ← Desactivado: endpoints están en escrutinio.py
from routes.candidatos import router as candidatos_router
from routes.delegados import router as delegados_router
from routes.geografia import router as geografia_router
from routes.dashboard import router as dashboard_router
from routes.usuarios import router as usuarios_router
from routes.organizaciones import router as organizaciones_router
from routes.resultados import router as geografia_router_resultados, dashboard_router as resultados_dashboard_router
from routes.cord_distrito import router as cord_distrito_router
from routes.cord_recinto import router as cord_recinto_router

app = FastAPI(title="Sistema Electoral Bolivia 2026")

# CORS - Configurar según el entorno
import os

# Detectar si estamos en Render
is_render = 'RENDER' in os.environ or os.getenv('PORT', '').isdigit()

# Detectar si estamos en PythonAnywhere
is_pythonanywhere = 'PYTHONANYWHERE' in os.environ or \
    os.getenv('DB_HOST', '').endswith('pythonanywhere-services.com')

if is_render:
    # Producción en Render
    allowed_origins = [
        "https://sistema-electoral-backend.onrender.com",
        "http://localhost:5173",
        "http://localhost:8000",
    ]
elif is_pythonanywhere:
    # Producción en PythonAnywhere
    allowed_origins = [
        "https://tu_usuario.pythonanywhere.com",
        "http://localhost:5173",
        "http://localhost:8000",
    ]
else:
    # Desarrollo local
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas corregidas
app.include_router(catalog_router, prefix="/api")
app.include_router(escrutinio_router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth")        # ← CORREGIDO
# app.include_router(actas_router, prefix="/api")  # ← Desactivado: endpoints están en escrutinio.py
app.include_router(candidatos_router, prefix="/api/candidatos")
app.include_router(delegados_router, prefix="/api")
app.include_router(geografia_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api/dashboard")
app.include_router(usuarios_router, prefix="/api")
app.include_router(organizaciones_router, prefix="/api")
app.include_router(geografia_router_resultados, prefix="/api/geografia")
app.include_router(resultados_dashboard_router, prefix="/api/dashboard")
app.include_router(cord_distrito_router, prefix="/api")
app.include_router(cord_recinto_router, prefix="/api")

# Health check endpoint (sin DB)
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "sistema-electoral-backend"}

@app.get("/")
def root():
    return {"message": "Sistema Electoral Bolivia 2026 API", "docs": "/docs"}

# Endpoint para debug de DB
@app.get("/api/debug/db")
def debug_db():
    """Verifica conexión a la base de datos"""
    try:
        from database import get_db
        conn = get_db()
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT 1 as test")
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            return {"status": "connected", "test": result}
        return {"status": "connection_failed"}
    except Exception as e:
        return {"status": "error", "error": str(e)}