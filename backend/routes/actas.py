# backend/routes/actas.py
from fastapi import APIRouter, Depends, HTTPException
from mysql.connector import Error
from database import get_db
from models import ActaCreate
from security import get_current_user
from db import get_actas_subnacionales, get_all_actas

router = APIRouter(prefix="/actas", tags=["actas"])

@router.post("/")
def registrar_acta(acta: ActaCreate, db=Depends(get_db), user=Depends(get_current_user)):
    cursor = db.cursor(dictionary=True)

    # Validar mesa
    cursor.execute("SELECT cantidad_inscritos FROM mesas WHERE id_mesa = %s", (acta.id_mesa,))
    mesa = cursor.fetchone()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    total_votos = acta.votos_blancos + acta.votos_nulos + sum(acta.votos.values())
    if total_votos > mesa["cantidad_inscritos"]:
        raise HTTPException(status_code=400, detail=f"{total_votos} votos superan los {mesa['cantidad_inscritos']} inscritos")

    # Guardar acta con campos correctos
    cursor.execute("""
        INSERT INTO actas (
            id_mesa,
            tipo_papeleta,
            votos_blancos,
            votos_nulos,
            observaciones,
            usuario_registro
        )
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        acta.id_mesa,
        acta.tipo_papeleta,
        acta.votos_blancos,
        acta.votos_nulos,
        acta.observaciones,
        user["id_usuario"]
    ))

    id_acta = cursor.lastrowid

    # Guardar votos por organización
    for id_org, cantidad in acta.votos.items():
        if cantidad > 0:
            cursor.execute("""
                INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad)
                VALUES (%s, %s, %s)
            """, (id_acta, id_org, cantidad))

    db.commit()
    return {"mensaje": "Acta registrada exitosamente", "id_acta": id_acta}
    
    
@router.get("/")
def listar_actas():
    """Lista todas las actas con geografía y resumen de votos."""
    return get_all_actas()

@router.get("/subnacional/listar")
def listar_actas_subnacionales():
    """Lista todas las actas subnacionales con geografía y resumen de votos."""
    return get_actas_subnacionales()