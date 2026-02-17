# backend/routes/candidatos.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db import (
    get_candidates_list,
    get_candidate_by_id,
    save_candidate_full,
    update_candidate,
    delete_candidate
)

router = APIRouter()

# === Modelos de datos ===
class CandidateCreate(BaseModel):
    id_organizacion: int
    id_cargo: int
    id_departamento: Optional[int] = None
    id_provincia: Optional[int] = None
    id_municipio: Optional[int] = None
    nombres: str
    apellidos: str
    genero: str  # 'M' o 'F'
    edad: int
    tipo_candidatura: str  # 'TITULAR' o 'SUPLENTE'

class CandidateUpdate(CandidateCreate):
    pass

# === Rutas ===
@router.get("/listar")
def listar_candidatos():
    """Devuelve la lista completa de candidatos con relaciones."""
    return get_candidates_list()

@router.get("/{id}")
def obtener_candidato(id: int):
    """Obtiene un candidato por ID."""
    cand = get_candidate_by_id(id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidato no encontrado")
    return cand

@router.post("")
def crear_candidato(candidate: CandidateCreate):
    """Crea un nuevo candidato."""
    if save_candidate_full(candidate.dict()):
        return {"message": "Candidato creado exitosamente"}
    raise HTTPException(status_code=500, detail="Error al guardar candidato")

@router.put("/actualizar/{id}")
def actualizar_candidato(id: int, candidate: CandidateUpdate):
    """Actualiza un candidato existente."""
    if update_candidate(id, candidate.dict()):
        return {"message": "Candidato actualizado exitosamente"}
    raise HTTPException(status_code=500, detail="Error al actualizar candidato")

@router.delete("/eliminar/{id}")
def eliminar_candidato(id: int):
    """Elimina un candidato por ID."""
    if delete_candidate(id):
        return {"message": "Candidato eliminado exitosamente"}
    raise HTTPException(status_code=404, detail="Candidato no encontrado")