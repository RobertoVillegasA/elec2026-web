# backend/routes/delegados.py
from fastapi import APIRouter, HTTPException, Query
from db import DatabaseConnection
from pydantic import BaseModel

router = APIRouter()

class DelegadoSchema(BaseModel):
    nombre: str
    apellido: str
    ci: str
    telefono: str = ""
    direccion: str
    id_organizacion: int
    id_mesa: int

@router.get("/delegados/listar")
def listar_delegados(
    departamento: int = Query(None),
    provincia: int = Query(None),
    municipio: int = Query(None),
    recinto: int = Query(None),
    organizacion: int = Query(None)
):
    """Lista delegados con filtros geográficos opcionales."""
    try:
        delegados = []
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor(dictionary=True)
            
            # Construir query con filtros
            query = """
                SELECT 
                    d.id_delegado,
                    d.nombre,
                    d.apellido,
                    d.ci,
                    d.telefono,
                    d.direccion,
                    d.id_organizacion,
                    d.id_mesa,
                    o.sigla AS organizacion_sigla,
                    m.numero_mesa,
                    r.id_recinto,
                    r.nombre AS recinto,
                    mu.id_municipio,
                    mu.nombre AS municipio,
                    p.id_provincia,
                    p.nombre AS provincia,
                    dep.id_departamento,
                    dep.nombre AS departamento
                FROM delegados d
                JOIN organizaciones_politicas o ON d.id_organizacion = o.id_organizacion
                JOIN mesas m ON d.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos dep ON p.id_departamento = dep.id_departamento
                WHERE 1=1
            """
            
            params = []
            if departamento is not None:
                query += " AND dep.id_departamento = %s"
                params.append(departamento)
            if provincia is not None:
                query += " AND p.id_provincia = %s"
                params.append(provincia)
            if municipio is not None:
                query += " AND mu.id_municipio = %s"
                params.append(municipio)
            if recinto is not None:
                query += " AND r.id_recinto = %s"
                params.append(recinto)
            if organizacion is not None:
                query += " AND d.id_organizacion = %s"
                params.append(organizacion)
            
            query += " ORDER BY d.id_delegado DESC"
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            delegados = cursor.fetchall()
        return delegados
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cargar delegados: {str(e)}")

@router.post("/delegados")
def crear_delegado(delegado: DelegadoSchema):
    """Registra un nuevo delegado."""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO delegados 
                (nombre, apellido, ci, telefono, direccion, id_organizacion, id_mesa)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                delegado.nombre,
                delegado.apellido,
                delegado.ci,
                delegado.telefono,
                delegado.direccion,
                delegado.id_organizacion,
                delegado.id_mesa
            ))
            conn.commit()
            return {"message": "Delegado registrado exitosamente"}
    raise HTTPException(status_code=500, detail="Error al registrar delegado")

@router.put("/delegados/{id_delegado}")
def editar_delegado(id_delegado: int, delegado: DelegadoSchema):
    """Edita un delegado existente."""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE delegados 
                SET nombre = %s, apellido = %s, ci = %s, telefono = %s, 
                    direccion = %s, id_organizacion = %s, id_mesa = %s
                WHERE id_delegado = %s
            """, (
                delegado.nombre,
                delegado.apellido,
                delegado.ci,
                delegado.telefono,
                delegado.direccion,
                delegado.id_organizacion,
                delegado.id_mesa,
                id_delegado
            ))
            if cursor.rowcount > 0:
                conn.commit()
                return {"message": "Delegado actualizado exitosamente"}
    raise HTTPException(status_code=404, detail="Delegado no encontrado")

@router.delete("/delegados/eliminar/{id_delegado}")
def eliminar_delegado(id_delegado: int):
    """Elimina un delegado por ID."""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM delegados WHERE id_delegado = %s", (id_delegado,))
            if cursor.rowcount > 0:
                conn.commit()
                return {"message": "Delegado eliminado exitosamente"}
    raise HTTPException(status_code=404, detail="Delegado no encontrado")

@router.get("/delegados/{id_delegado}")
def obtener_delegado(id_delegado: int):
    """Obtiene detalles de un delegado específico."""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    d.id_delegado,
                    d.nombre,
                    d.apellido,
                    d.ci,
                    d.telefono,
                    d.direccion,
                    d.id_organizacion,
                    d.id_mesa
                FROM delegados d
                WHERE d.id_delegado = %s
            """, (id_delegado,))
            result = cursor.fetchone()
            if result:
                return result
    raise HTTPException(status_code=404, detail="Delegado no encontrado")