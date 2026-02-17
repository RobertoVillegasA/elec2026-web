# backend/routes/organizaciones.py
from fastapi import APIRouter, HTTPException
from db import DatabaseConnection
from pydantic import BaseModel

router = APIRouter()

class OrganizacionSchema(BaseModel):
    nombre: str
    sigla: str
    descripcion: str = ""  # Opcional, aunque la BD no la almacena

@router.get("/organizaciones")
def listar_organizaciones():
    """Lista todas las organizaciones políticas."""
    try:
        organizaciones = []
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_organizacion, nombre, sigla
                FROM organizaciones_politicas
                ORDER BY nombre ASC
            """)
            organizaciones = cursor.fetchall()
        return organizaciones
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar organizaciones: {str(e)}")

@router.post("/organizaciones")
def crear_organizacion(org: OrganizacionSchema):
    """Crea una nueva organización política."""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO organizaciones_politicas (nombre, sigla)
                VALUES (%s, %s)
            """, (org.nombre, org.sigla))
            conn.commit()
            
            return {"message": "Organización creada exitosamente", "id": cursor.lastrowid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear organización: {str(e)}")

@router.put("/organizaciones/{id_organizacion}")
def actualizar_organizacion(id_organizacion: int, org: OrganizacionSchema):
    """Actualiza una organización política."""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE organizaciones_politicas
                SET nombre = %s, sigla = %s
                WHERE id_organizacion = %s
            """, (org.nombre, org.sigla, id_organizacion))
            
            if cursor.rowcount > 0:
                conn.commit()
                return {"message": "Organización actualizada exitosamente"}
            else:
                raise HTTPException(status_code=404, detail="Organización no encontrada")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar organización: {str(e)}")

@router.delete("/organizaciones/{id_organizacion}")
def eliminar_organizacion(id_organizacion: int):
    """Elimina una organización política."""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor()
            
            # Verificar si hay candidatos asociados
            cursor.execute("""
                SELECT COUNT(*) as count FROM candidatos
                WHERE id_organizacion = %s
            """, (id_organizacion,))
            result = cursor.fetchone()
            candidatos_count = result[0] if result else 0
            
            if candidatos_count > 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"No se puede eliminar la organización. Hay {candidatos_count} candidato(s) asociado(s). Elimina los candidatos primero."
                )
            
            # Si no hay candidatos, proceder con la eliminación
            cursor.execute("""
                DELETE FROM organizaciones_politicas
                WHERE id_organizacion = %s
            """, (id_organizacion,))
            
            if cursor.rowcount > 0:
                conn.commit()
                return {"message": "Organización eliminada exitosamente"}
            else:
                raise HTTPException(status_code=404, detail="Organización no encontrada")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar organización: {str(e)}")

@router.get("/organizaciones/{id_organizacion}")
def obtener_organizacion(id_organizacion: int):
    """Obtiene una organización específica."""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_organizacion, nombre, sigla
                FROM organizaciones_politicas
                WHERE id_organizacion = %s
            """, (id_organizacion,))
            
            org = cursor.fetchone()
            if org:
                return org
            else:
                raise HTTPException(status_code=404, detail="Organización no encontrada")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener organización: {str(e)}")
