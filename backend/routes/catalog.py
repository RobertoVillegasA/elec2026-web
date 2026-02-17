# backend/routes/catalog.py
from fastapi import APIRouter, HTTPException
from db import DatabaseConnection

router = APIRouter()

@router.get("/catalog")
def get_catalog(table: str):
    """
    Devuelve un catálogo como {nombre: id} o {sigla: id}.
    Soporta: departamentos, provincias, municipios, recintos, mesas, organizaciones_politicas, cargos
    """
    table_config = {
        "departamentos": ("id_departamento", "nombre"),
        "provincias": ("id_provincia", "nombre_provincia"),
        "municipios": ("id_municipio", "nombre_municipio"),
        "recintos": ("id_recinto", "nombre"),
        "mesas": ("id_mesa", "numero_mesa"),
        "organizaciones_politicas": ("id_organizacion", "sigla"),
        "cargos": ("id_cargo", "nombre_cargo")
    }
    
    if table not in table_config:
        raise HTTPException(status_code=400, detail=f"Tabla '{table}' no soportada")
    
    id_col, name_col = table_config[table]
    
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            query = f"SELECT {id_col}, {name_col} FROM {table}"
            cursor.execute(query)
            rows = cursor.fetchall()
            return {row[1]: row[0] for row in rows}
    return {}