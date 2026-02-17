# backend/routes/geografia.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db import (
    DatabaseConnection,
    get_catalog,
    get_provincias_by_depto,
    get_municipios_by_provincia,
    get_recintos_by_municipio,
    get_mesas_by_recinto,
    insert_departamento,
    insert_provincia,
    insert_municipio,
    insert_recinto,
    insert_mesa
)

router = APIRouter()

# === Modelos de datos ===
class DepartamentoCreate(BaseModel):
    nombre: str

class ProvinciaCreate(BaseModel):
    nombre: str
    id_departamento: int

class MunicipioCreate(BaseModel):
    nombre: str
    id_provincia: int

class RecintoCreate(BaseModel):
    nombre: str
    id_municipio: int

class MesaCreate(BaseModel):
    numero_mesa: int
    id_recinto: int

# === CATÁLOGOS DE LECTURA ===
@router.get("/departamentos")
def listar_departamentos():
    return get_catalog("departamentos")

@router.get("/provincias/departamento/{id_depto}")
def listar_provincias(id_depto: int):
    return get_provincias_by_depto(id_depto)

@router.get("/municipios/provincia/{id_prov}")
def listar_municipios(id_prov: int):
    return get_municipios_by_provincia(id_prov)

@router.get("/recintos/municipio/{id_muni}")
def listar_recintos(id_muni: int):
    return get_recintos_by_municipio(id_muni)

@router.get("/mesas/recinto/{id_recinto}")
def listar_mesas(id_recinto: int):
    return get_mesas_by_recinto(id_recinto)

# === CREACIÓN DE ENTIDADES ===
@router.post("/departamentos")
def crear_departamento( DepartamentoCreate):
    id_new = insert_departamento(data.nombre)
    if id_new:
        return {"id": id_new, "nombre": data.nombre}
    raise HTTPException(status_code=500, detail="Error al crear departamento")

@router.post("/provincias")
def crear_provincia( ProvinciaCreate):
    id_new = insert_provincia(data.nombre, data.id_departamento)
    if id_new:
        return {"id": id_new, "nombre": data.nombre, "id_departamento": data.id_departamento}
    raise HTTPException(status_code=500, detail="Error al crear provincia")

@router.post("/municipios")
def crear_municipio( MunicipioCreate):
    id_new = insert_municipio(data.nombre, data.id_provincia)
    if id_new:
        return {"id": id_new, "nombre": data.nombre, "id_provincia": data.id_provincia}
    raise HTTPException(status_code=500, detail="Error al crear municipio")

@router.post("/recintos")
def crear_recinto( RecintoCreate):
    id_new = insert_recinto(data.nombre, data.id_municipio)
    if id_new:
        return {"id": id_new, "nombre": data.nombre, "id_municipio": data.id_municipio}
    raise HTTPException(status_code=500, detail="Error al crear recinto")

@router.post("/mesas")
def crear_mesa( MesaCreate):
    id_new = insert_mesa(data.numero_mesa, data.id_recinto)
    if id_new:
        return {"id": id_new, "numero_mesa": data.numero_mesa, "id_recinto": data.id_recinto}
    raise HTTPException(status_code=500, detail="Error al crear mesa")

@router.get("/mesas/buscar")
def buscar_mesa_por_numero(numero: str):
    """Busca una mesa por su número y devuelve su información geográfica completa."""
    try:
        numero_int = int(numero)
    except ValueError:
        return None
        
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    m.id_mesa,
                    m.numero_mesa,
                    m.cantidad_inscritos,
                    r.nombre AS recinto,
                    mu.nombre AS municipio,
                    p.nombre AS provincia,
                    d.nombre AS departamento
                FROM mesas m
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE m.numero_mesa = %s
            """, (numero_int,))
            return cursor.fetchone()
    return None



@router.get("/mesas/{id_mesa}")
def get_mesa(id_mesa: int):
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    m.id_mesa,
                    m.numero_mesa,
                    m.cantidad_inscritos,
                    r.nombre AS recinto,
                    mu.nombre AS municipio,
                    p.nombre AS provincia,
                    d.nombre AS departamento
                FROM mesas m
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE m.id_mesa = %s
            """, (id_mesa,))
            result = cursor.fetchone()
            if result:
                return result
    raise HTTPException(status_code=404, detail="Mesa no encontrada")

# routes/geografia.py
