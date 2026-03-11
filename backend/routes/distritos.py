# backend/routes/distritos.py
from fastapi import APIRouter, HTTPException
from db import DatabaseConnection

router = APIRouter()

@router.get("/distritos")
def listar_distritos():
    """Lista todos los distritos registrados con su ubicación"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_distrito, nro_distrito, nombre, departamento, provincia, municipio
                FROM distritos
                ORDER BY nro_distrito ASC
            """)
            distritos = cursor.fetchall()
            return distritos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cargar distritos: {str(e)}")

@router.get("/distritos/{id_distrito}")
def obtener_distrito(id_distrito: int):
    """Obtiene un distrito por ID"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_distrito, nro_distrito
                FROM distritos
                WHERE id_distrito = %s
            """, (id_distrito,))
            distrito = cursor.fetchone()
            
            if not distrito:
                raise HTTPException(status_code=404, detail="Distrito no encontrado")
            
            return distrito
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
