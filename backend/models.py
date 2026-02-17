# backend/models.py
from pydantic import BaseModel
from typing import Optional, List

class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    username: str
    password: str

class ActaCreate(BaseModel):
    id_mesa: int
    tipo_papeleta: str
    votos_blancos_g: int = 0
    votos_nulos_g: int = 0
    votos_blancos_a: int = 0
    votos_nulos_a: int = 0
    votos_blancos_c: int = 0
    votos_nulos_c: int = 0
    votos_blancos_p: int = 0
    votos_nulos_p: int = 0
    votos_blancos_t: int = 0
    votos_nulos_t: int = 0
    observaciones: Optional[str] = None
    votos: dict  # {id_organizacion: cantidad}

class ActaUpdate(BaseModel):
    tipo_papeleta: str
    codigo_acta: str
    votos_blancos_g: Optional[int] = 0
    votos_nulos_g: Optional[int] = 0
    votos_blancos_a: Optional[int] = 0
    votos_nulos_a: Optional[int] = 0
    votos_blancos_c: Optional[int] = 0
    votos_nulos_c: Optional[int] = 0
    votos_blancos_p: Optional[int] = 0
    votos_nulos_p: Optional[int] = 0
    votos_blancos_t: Optional[int] = 0
    votos_nulos_t: Optional[int] = 0
    observaciones: Optional[str] = None

class CandidatoCreate(BaseModel):
    id_organizacion: int
    id_cargo: int
    id_departamento: Optional[int] = None
    id_municipio: Optional[int] = None
    nombres: str
    apellidos: str
    genero: str  # "M" o "F"
    edad: int
    tipo_candidatura: str  # "TITULAR" o "SUPLENTE"