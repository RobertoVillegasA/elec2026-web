# backend/routes/cord_recinto.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db import DatabaseConnection

router = APIRouter()

# Modelos de datos
class CoordRecintoBase(BaseModel):
    nombre: str
    apellido: str
    ci: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    id_recinto: int

class CoordRecintoCreate(CoordRecintoBase):
    pass

class CoordRecintoUpdate(CoordRecintoBase):
    pass

# Rutas CRUD
@router.get("/cord_recinto")
def listar_coord_recinto():
    """Obtiene todos los coordinadores de recinto"""
    coords = []
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT cr.id_cord_recinto, cr.nombre, cr.apellido, cr.ci, cr.telefono, 
                       cr.direccion, cr.id_recinto, cr.fecha_registro, cr.fecha_actualizacion,
                       r.nombre as nombre_recinto
                FROM cord_recinto cr
                LEFT JOIN recintos r ON cr.id_recinto = r.id_recinto
                ORDER BY cr.fecha_registro DESC
            """)
            coords = cursor.fetchall()
    return coords

@router.get("/cord_recinto/{id}")
def obtener_coord_recinto(id: int):
    """Obtiene un coordinador de recinto por ID"""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT cr.id_cord_recinto, cr.nombre, cr.apellido, cr.ci, cr.telefono, 
                       cr.direccion, cr.id_recinto, cr.fecha_registro, cr.fecha_actualizacion,
                       r.nombre as nombre_recinto
                FROM cord_recinto cr
                LEFT JOIN recintos r ON cr.id_recinto = r.id_recinto
                WHERE cr.id_cord_recinto = %s
            """, (id,))
            coord = cursor.fetchone()
            if not coord:
                raise HTTPException(status_code=404, detail="Coordinador de recinto no encontrado")
            return coord
    raise HTTPException(status_code=500, detail="Error de conexión con la base de datos")

@router.post("/cord_recinto")
def crear_coord_recinto(coord_data: CoordRecintoCreate):
    """Crea un nuevo coordinador de recinto"""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            # Verificar que el recinto exista
            cursor.execute("SELECT id_recinto FROM recintos WHERE id_recinto = %s", (coord_data.id_recinto,))
            if not cursor.fetchone():
                raise HTTPException(status_code=400, detail="El recinto especificado no existe")
            
            try:
                cursor.execute("""
                    INSERT INTO cord_recinto (nombre, apellido, ci, telefono, direccion, id_recinto)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    coord_data.nombre,
                    coord_data.apellido,
                    coord_data.ci,
                    coord_data.telefono,
                    coord_data.direccion,
                    coord_data.id_recinto
                ))
                conn.commit()
                return {"message": "Coordinador de recinto creado exitosamente", "id": cursor.lastrowid}
            except Exception as e:
                conn.rollback()
                if "Duplicate entry" in str(e) and "ci" in str(e):
                    raise HTTPException(status_code=400, detail="El CI ya está registrado")
                raise HTTPException(status_code=500, detail=f"Error al crear coordinador: {str(e)}")
    raise HTTPException(status_code=500, detail="Error de conexión con la base de datos")

@router.put("/cord_recinto/{id}")
def actualizar_coord_recinto(id: int, coord_data: CoordRecintoUpdate):
    """Actualiza un coordinador de recinto existente"""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            # Verificar si existe
            cursor.execute("SELECT id_cord_recinto FROM cord_recinto WHERE id_cord_recinto = %s", (id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Coordinador de recinto no encontrado")
            
            # Verificar que el recinto exista
            cursor.execute("SELECT id_recinto FROM recintos WHERE id_recinto = %s", (coord_data.id_recinto,))
            if not cursor.fetchone():
                raise HTTPException(status_code=400, detail="El recinto especificado no existe")
            
            try:
                cursor.execute("""
                    UPDATE cord_recinto
                    SET nombre = %s, apellido = %s, ci = %s, telefono = %s, 
                        direccion = %s, id_recinto = %s
                    WHERE id_cord_recinto = %s
                """, (
                    coord_data.nombre,
                    coord_data.apellido,
                    coord_data.ci,
                    coord_data.telefono,
                    coord_data.direccion,
                    coord_data.id_recinto,
                    id
                ))
                conn.commit()
                return {"message": "Coordinador de recinto actualizado exitosamente"}
            except Exception as e:
                conn.rollback()
                if "Duplicate entry" in str(e) and "ci" in str(e):
                    raise HTTPException(status_code=400, detail="El CI ya está registrado")
                raise HTTPException(status_code=500, detail=f"Error al actualizar coordinador: {str(e)}")
    raise HTTPException(status_code=500, detail="Error de conexión con la base de datos")

@router.delete("/cord_recinto/{id}")
def eliminar_coord_recinto(id: int):
    """Elimina un coordinador de recinto"""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            # Verificar si existe
            cursor.execute("SELECT id_cord_recinto FROM cord_recinto WHERE id_cord_recinto = %s", (id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Coordinador de recinto no encontrado")
            
            cursor.execute("DELETE FROM cord_recinto WHERE id_cord_recinto = %s", (id,))
            conn.commit()
            return {"message": "Coordinador de recinto eliminado exitosamente"}
    raise HTTPException(status_code=500, detail="Error de conexión con la base de datos")