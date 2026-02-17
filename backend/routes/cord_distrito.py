# backend/routes/cord_distrito.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db import DatabaseConnection

router = APIRouter()

# Modelos de datos
class CoordDistritoBase(BaseModel):
    nombre: str
    apellido: str
    ci: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    nro_dist: str

class CoordDistritoCreate(CoordDistritoBase):
    pass

class CoordDistritoUpdate(CoordDistritoBase):
    pass

# Rutas CRUD
@router.get("/cord_dist")
def listar_coord_distrito():
    """Obtiene todos los coordinadores de distrito"""
    coords = []
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_cord_distrito, nombre, apellido, ci, telefono, direccion, nro_dist,
                       fecha_registro, fecha_actualizacion
                FROM cord_dist
                ORDER BY fecha_registro DESC
            """)
            coords = cursor.fetchall()
    return coords

@router.get("/cord_dist/{id}")
def obtener_coord_distrito(id: int):
    """Obtiene un coordinador de distrito por ID"""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_cord_distrito, nombre, apellido, ci, telefono, direccion, nro_dist,
                       fecha_registro, fecha_actualizacion
                FROM cord_dist
                WHERE id_cord_distrito = %s
            """, (id,))
            coord = cursor.fetchone()
            if not coord:
                raise HTTPException(status_code=404, detail="Coordinador de distrito no encontrado")
            return coord
    raise HTTPException(status_code=500, detail="Error de conexión con la base de datos")

@router.post("/cord_dist")
def crear_coord_distrito(coord_data: CoordDistritoCreate):
    """Crea un nuevo coordinador de distrito"""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    INSERT INTO cord_dist (nombre, apellido, ci, telefono, direccion, nro_dist)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    coord_data.nombre,
                    coord_data.apellido,
                    coord_data.ci,
                    coord_data.telefono,
                    coord_data.direccion,
                    coord_data.nro_dist
                ))
                conn.commit()
                return {"message": "Coordinador de distrito creado exitosamente", "id": cursor.lastrowid}
            except Exception as e:
                conn.rollback()
                if "Duplicate entry" in str(e) and "ci" in str(e):
                    raise HTTPException(status_code=400, detail="El CI ya está registrado")
                raise HTTPException(status_code=500, detail=f"Error al crear coordinador: {str(e)}")
    raise HTTPException(status_code=500, detail="Error de conexión con la base de datos")

@router.put("/cord_dist/{id}")
def actualizar_coord_distrito(id: int, coord_data: CoordDistritoUpdate):
    """Actualiza un coordinador de distrito existente"""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            # Verificar si existe
            cursor.execute("SELECT id_cord_distrito FROM cord_dist WHERE id_cord_distrito = %s", (id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Coordinador de distrito no encontrado")
            
            try:
                cursor.execute("""
                    UPDATE cord_dist
                    SET nombre = %s, apellido = %s, ci = %s, telefono = %s, 
                        direccion = %s, nro_dist = %s
                    WHERE id_cord_distrito = %s
                """, (
                    coord_data.nombre,
                    coord_data.apellido,
                    coord_data.ci,
                    coord_data.telefono,
                    coord_data.direccion,
                    coord_data.nro_dist,
                    id
                ))
                conn.commit()
                return {"message": "Coordinador de distrito actualizado exitosamente"}
            except Exception as e:
                conn.rollback()
                if "Duplicate entry" in str(e) and "ci" in str(e):
                    raise HTTPException(status_code=400, detail="El CI ya está registrado")
                raise HTTPException(status_code=500, detail=f"Error al actualizar coordinador: {str(e)}")
    raise HTTPException(status_code=500, detail="Error de conexión con la base de datos")

@router.delete("/cord_dist/{id}")
def eliminar_coord_distrito(id: int):
    """Elimina un coordinador de distrito"""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            # Verificar si existe
            cursor.execute("SELECT id_cord_distrito FROM cord_dist WHERE id_cord_distrito = %s", (id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Coordinador de distrito no encontrado")
            
            cursor.execute("DELETE FROM cord_dist WHERE id_cord_distrito = %s", (id,))
            conn.commit()
            return {"message": "Coordinador de distrito eliminado exitosamente"}
    raise HTTPException(status_code=500, detail="Error de conexión con la base de datos")