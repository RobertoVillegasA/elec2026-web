# backend/routes/dashboard.py
from fastapi import APIRouter
from db import (
    get_resumen_dashboard,
    get_resultados_globales,
    get_resultados_departamental,
    get_resultados_municipal,
    get_actas_subnacionales
)

router = APIRouter()

@router.get("/resumen")
def resumen_dashboard():
    """Obtiene métricas generales del sistema."""
    return get_resumen_dashboard()

@router.get("/resultados/globales")
def resultados_globales():
    """Obtiene el total de votos por organización política (nacional)."""
    return get_resultados_globales()

@router.get("/resultados/departamental")
def resultados_departamental():
    """Obtiene el total de votos por departamento."""
    return get_resultados_departamental()

@router.get("/resultados/municipal")
def resultados_municipal():
    """Obtiene el total de votos por municipio."""
    return get_resultados_municipal()

@router.get("/actas/subnacionales")
def listar_actas_subnacionales():
    """Lista todas las actas subnacionales registradas con geografía y totales."""
    return get_actas_subnacionales()