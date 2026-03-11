# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from routes.catalog import router as catalog_router
from routes.escrutinio import router as escrutinio_router
from routes.auth import router as auth_router
from routes.candidatos import router as candidatos_router
from routes.delegados import router as delegados_router
from routes.geografia import router as geografia_router
from routes.dashboard import router as dashboard_router
from routes.usuarios import router as usuarios_router
from routes.organizaciones import router as organizaciones_router
from routes.resultados import router as geografia_router_resultados, dashboard_router as resultados_dashboard_router
from routes.distritos import router as distritos_router

app = FastAPI(title="Sistema Electoral Bolivia 2026")

# CORS - Configurar según el entorno
import os

# Leer CORS_ORIGIN desde variable de entorno (se configura en Railway/Render)
cors_origin_env = os.getenv('CORS_ORIGIN', '')

# Detectar entorno
is_railway = 'RAILWAY_ENVIRONMENT' in os.environ or 'RAILWAY_PROJECT_ID' in os.environ
is_render = 'RENDER' in os.environ
is_pythonanywhere = 'PYTHONANYWHERE' in os.environ or \
    os.getenv('DB_HOST', '').endswith('pythonanywhere-services.com')

# Orígenes base siempre permitidos (desarrollo local)
base_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
]

if cors_origin_env:
    # Si se configuró CORS_ORIGIN en las variables de entorno, usarlo
    allowed_origins = base_origins + [cors_origin_env]
elif is_railway:
    # Railway: permitir cualquier origen de railway.app + localhost
    allowed_origins = base_origins + [
        "https://*.railway.app",
        "https://*.up.railway.app",
    ]
elif is_render:
    allowed_origins = base_origins + [
        "https://sistema-electoral-backend.onrender.com",
    ]
elif is_pythonanywhere:
    allowed_origins = base_origins + [
        "https://tu_usuario.pythonanywhere.com",
    ]
else:
    # Desarrollo local
    allowed_origins = base_origins

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
app.include_router(auth_router, prefix="/api/auth")
app.include_router(candidatos_router, prefix="/api/candidatos")
app.include_router(delegados_router, prefix="/api")
app.include_router(geografia_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api/dashboard")
app.include_router(usuarios_router, prefix="/api")
app.include_router(organizaciones_router, prefix="/api")
app.include_router(geografia_router_resultados, prefix="/api/geografia")
app.include_router(resultados_dashboard_router, prefix="/api/dashboard")
app.include_router(distritos_router, prefix="/api")

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