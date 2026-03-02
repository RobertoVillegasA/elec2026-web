# backend/routes/escrutinio.py
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import Dict, Optional, Any, List
from db import DatabaseConnection
import asyncio
import time

router = APIRouter()

class ActaRequest(BaseModel):
    acta_info: dict
    votos_partidos: Dict[int, int]


class ActaUpdate(BaseModel):
    codigo_acta: str
    tipo_papeleta: str = 'MUNICIPAL'
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

@router.post("/escrutinio/guardar")
async def guardar_acta(
    id_mesa: int = Form(...),
    tipo: str = Form(...),
    codigo_acta: str = Form(...),  # ← Nuevo campo
    blancos: int = Form(...),
    nulos: int = Form(...),
    observaciones: Optional[str] = Form(None),
    user_id: int = Form(...),
    votos_partidos: str = Form(...),  # JSON string
    f_acta: UploadFile = File(None),
    f_h_trabajo: UploadFile = File(None)
):
    try:
        import json
        votos_dict = json.loads(votos_partidos)

        f_acta_bin = await f_acta.read() if f_acta else None
        f_h_trabajo_bin = await f_h_trabajo.read() if f_h_trabajo else None

        # Reintentar operación si hay problemas de conexión
        max_retries = 2
        last_error = None
        
        for attempt in range(max_retries):
            try:
                with DatabaseConnection() as conn:
                    if not conn:
                        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

                    cursor = conn.cursor()

                    # 🔑 VALIDACIÓN: Validar que codigo_acta no esté vacío
                    if not codigo_acta or not codigo_acta.strip():
                        raise HTTPException(status_code=400, detail="El código de acta no puede estar vacío")

                    codigo_acta_limpio = codigo_acta.strip()

                    # 🔑 VALIDACIÓN: ¿Ya existe un acta con ese código?
                    cursor.execute("SELECT id_acta FROM actas WHERE codigo_acta = %s", (codigo_acta_limpio,))
                    if cursor.fetchone():
                        raise HTTPException(status_code=400, detail=f"El código de acta '{codigo_acta_limpio}' ya está registrado")

                    # Insertar acta
                    cursor.execute("""
                        INSERT INTO actas (
                            id_mesa, tipo_papeleta, codigo_acta, votos_blancos, votos_nulos,
                            observaciones, usuario_registro
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        id_mesa,
                        tipo,
                        codigo_acta_limpio,
                        blancos,
                        nulos,
                        observaciones,
                        user_id
                    ))

                    id_acta = cursor.lastrowid

                    # Insertar votos
                    for id_org, votos in votos_dict.items():
                        if votos > 0:
                            cursor.execute("""
                                INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad)
                                VALUES (%s, %s, %s)
                            """, (id_acta, id_org, votos))

                    # Si llegamos aquí, todo salió bien
                    return {"message": "✅ Acta registrada exitosamente", "id_acta": id_acta}
                    
            except HTTPException:
                raise  # Errores HTTP se re-lanzan inmediatamente
            except Exception as e:
                last_error = e
                print(f"⚠️ Intento {attempt + 1}/{max_retries} fallido: {str(e)}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(1)  # Esperar 1 segundo antes de reintentar
                    continue
                else:
                    break
        
        # Si llegamos aquí, todos los intentos fallaron
        error_msg = str(last_error) if last_error else "Error desconocido al guardar acta"
        print(f"❌ Error al guardar acta después de {max_retries} intentos: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error al guardar el acta: {error_msg}")

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error general en guardar_acta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== LISTAR TODAS LAS ACTAS ==========
@router.get("/actas")
async def listar_actas():
    """Obtiene todas las actas registradas con sus votos por organización"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor(dictionary=True)
            
            # Obtener las actas
            cursor.execute("""
                SELECT
                    a.id_acta, a.id_mesa, a.tipo_papeleta, a.codigo_acta,
                    a.votos_blancos_g, a.votos_nulos_g,
                    a.votos_blancos_a, a.votos_nulos_a,
                    a.votos_blancos_c, a.votos_nulos_c,
                    a.votos_blancos_p, a.votos_nulos_p,
                    a.votos_blancos_t, a.votos_nulos_t,
                    a.total_actas,
                    a.f_acta, a.f_h_trabajo,
                    a.observaciones, a.usuario_registro, a.fecha_registro,
                    m.numero_mesa,
                    r.nombre AS nombre_recinto,
                    mu.nombre AS nombre_municipio,
                    p.nombre AS nombre_provincia,
                    d.nombre AS nombre_departamento
                FROM actas a
                LEFT JOIN mesas m ON a.id_mesa = m.id_mesa
                LEFT JOIN recintos r ON m.id_recinto = r.id_recinto
                LEFT JOIN municipios mu ON r.id_municipio = mu.id_municipio
                LEFT JOIN provincias p ON mu.id_provincia = p.id_provincia
                LEFT JOIN departamentos d ON p.id_departamento = d.id_departamento
                ORDER BY a.fecha_registro DESC
            """)
            
            actas = cursor.fetchall()
            
            # Para cada acta, obtener los votos por organización
            for acta in actas:
                cursor.execute("""
                    SELECT
                        op.id_organizacion, op.nombre, op.sigla,
                        vd.votos_cantidad, vd.tipo_voto
                    FROM votos_detalle vd
                    JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                    WHERE vd.id_acta = %s
                    ORDER BY op.nombre ASC
                """, (acta['id_acta'],))

                votos = cursor.fetchall()
                acta['votos_detalle'] = votos if votos else []
            
            cursor.close()
            return actas
            
    except Exception as e:
        print(f"❌ Error al listar actas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== OBTENER UNA ACTA ==========
@router.get("/actas/{id_acta}")
async def obtener_acta(id_acta: int):
    """Obtiene los detalles de una acta específica"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor(dictionary=True)
            
            # Obtener datos del acta
            cursor.execute("""
                SELECT 
                    a.id_acta, a.id_mesa, a.tipo_papeleta, a.codigo_acta,
                    a.votos_blancos, a.votos_nulos, a.observaciones,
                    a.usuario_registro, a.fecha_registro
                FROM actas a
                WHERE a.id_acta = %s
            """, (id_acta,))
            
            acta = cursor.fetchone()
            if not acta:
                raise HTTPException(status_code=404, detail="Acta no encontrada")
            
            # Obtener votos detallados
            cursor.execute("""
                SELECT vd.id_organizacion, vd.votos_cantidad, vd.tipo_voto, op.nombre
                FROM votos_detalle vd
                LEFT JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                WHERE vd.id_acta = %s
            """, (id_acta,))
            
            votos = cursor.fetchall()
            acta['votos'] = votos
            
            cursor.close()
            return acta
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener acta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== ACTUALIZAR ACTA ==========
@router.put("/actas/{id_acta}")
async def actualizar_acta(id_acta: int, datos: ActaUpdate):
    """Actualiza los datos de una acta"""
    try:
        if not datos.codigo_acta or not datos.codigo_acta.strip():
            raise HTTPException(status_code=400, detail="El código de acta no puede estar vacío")
        
        codigo_acta = datos.codigo_acta.strip()
        
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor()
            
            # Verificar que el acta existe
            cursor.execute("SELECT id_acta FROM actas WHERE id_acta = %s", (id_acta,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Acta no encontrada")
            
            # Verificar que el nuevo código no sea duplicado (si cambió)
            cursor.execute("SELECT id_acta FROM actas WHERE codigo_acta = %s AND id_acta != %s", 
                          (codigo_acta, id_acta))
            if cursor.fetchone():
                raise HTTPException(status_code=400, 
                                  detail=f"El código de acta '{codigo_acta}' ya está en uso")
            
            # Actualizar acta
            cursor.execute("""
                UPDATE actas
                SET tipo_papeleta = %s, codigo_acta = %s, votos_blancos_g = %s,
                    votos_nulos_g = %s, votos_blancos_a = %s, votos_nulos_a = %s,
                    votos_blancos_c = %s, votos_nulos_c = %s, votos_blancos_p = %s,
                    votos_nulos_p = %s, votos_blancos_t = %s, votos_nulos_t = %s,
                    observaciones = %s
                WHERE id_acta = %s
            """, (
                datos.tipo_papeleta, 
                codigo_acta, 
                getattr(datos, 'votos_blancos_g', 0),
                getattr(datos, 'votos_nulos_g', 0),
                getattr(datos, 'votos_blancos_a', 0),
                getattr(datos, 'votos_nulos_a', 0),
                getattr(datos, 'votos_blancos_c', 0),
                getattr(datos, 'votos_nulos_c', 0),
                getattr(datos, 'votos_blancos_p', 0),
                getattr(datos, 'votos_nulos_p', 0),
                getattr(datos, 'votos_blancos_t', 0),
                getattr(datos, 'votos_nulos_t', 0),
                datos.observaciones, 
                id_acta
            ))
            
            cursor.close()
            return {"message": "✅ Acta actualizada exitosamente", "id_acta": id_acta}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al actualizar acta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== ELIMINAR ACTA ==========
@router.delete("/actas/{id_acta}")
async def eliminar_acta(id_acta: int):
    """Elimina una acta y todos sus votos relacionados"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor()
            
            # Verificar que el acta existe
            cursor.execute("SELECT id_acta FROM actas WHERE id_acta = %s", (id_acta,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Acta no encontrada")
            
            # Eliminar votos asociados
            cursor.execute("DELETE FROM votos_detalle WHERE id_acta = %s", (id_acta,))
            
            # Eliminar acta
            cursor.execute("DELETE FROM actas WHERE id_acta = %s", (id_acta,))
            
            cursor.close()
            return {"message": "✅ Acta eliminada exitosamente", "id_acta": id_acta}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al eliminar acta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== GUARDAR DOS PAPELETAS SIMULTANEAMENTE ==========
@router.post("/escrutinio/dual-papeleta")
async def guardar_dual_papeleta(
    id_mesa: int = Form(...),
    codigo_acta: str = Form(...),
    observaciones: Optional[str] = Form(None),
    user_id: int = Form(...),
    gobernador_cargo: int = Form(...),
    gobernador_blancos: int = Form(...),
    gobernador_nulos: int = Form(...),
    gobernador_votos: str = Form(...),  # JSON string
    concejal_cargo: int = Form(...),
    concejal_blancos: int = Form(...),
    concejal_nulos: int = Form(...),
    concejal_votos: str = Form(...),  # JSON string
    f_acta: UploadFile = File(None),
    f_h_trabajo: UploadFile = File(None)
):
    """Guarda DOS actas simultáneamente: una para Gobernador y otra para Concejal"""
    try:
        import json
        
        # Parse JSON strings
        gobernador_votos_dict = json.loads(gobernador_votos)
        concejal_votos_dict = json.loads(concejal_votos)
        
        # Leer archivos si existen
        f_acta_bin = await f_acta.read() if f_acta else None
        f_h_trabajo_bin = await f_h_trabajo.read() if f_h_trabajo else None
        
        # Validaciones
        if not codigo_acta or not codigo_acta.strip():
            raise HTTPException(status_code=400, detail="El código de acta no puede estar vacío")
        
        codigo_acta_limpio = codigo_acta.strip()
        
        max_retries = 2
        last_error = None
        
        for attempt in range(max_retries):
            try:
                with DatabaseConnection() as conn:
                    if not conn:
                        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
                    
                    cursor = conn.cursor()
                    
                    # Validar que el codigo_acta no esté duplicado
                    cursor.execute("SELECT id_acta FROM actas WHERE codigo_acta = %s", (codigo_acta_limpio,))
                    if cursor.fetchone():
                        raise HTTPException(status_code=400, detail=f"El código de acta '{codigo_acta_limpio}' ya está registrado")
                    
                    # PAPELETA 1: GOBERNADOR (SUBNACIONAL)
                    cursor.execute("""
                        INSERT INTO actas (
                            id_mesa, tipo_papeleta, codigo_acta, votos_blancos, votos_nulos,
                            observaciones, usuario_registro
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        id_mesa,
                        'SUBNACIONAL',
                        codigo_acta_limpio + '_GOB',  # Agregar sufijo para diferenciar
                        gobernador_blancos,
                        gobernador_nulos,
                        observaciones,
                        user_id
                    ))
                    
                    id_acta_gobernador = cursor.lastrowid
                    
                    # Insertar votos de Gobernador
                    for id_org, votos in gobernador_votos_dict.items():
                        if votos > 0:
                            cursor.execute("""
                                INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad)
                                VALUES (%s, %s, %s)
                            """, (id_acta_gobernador, id_org, votos))
                    
                    # PAPELETA 2: CONCEJAL (MUNICIPAL)
                    cursor.execute("""
                        INSERT INTO actas (
                            id_mesa, tipo_papeleta, codigo_acta, votos_blancos, votos_nulos,
                            observaciones, usuario_registro
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        id_mesa,
                        'MUNICIPAL',
                        codigo_acta_limpio + '_CON',  # Agregar sufijo para diferenciar
                        concejal_blancos,
                        concejal_nulos,
                        observaciones,
                        user_id
                    ))
                    
                    id_acta_concejal = cursor.lastrowid
                    
                    # Insertar votos de Concejal
                    for id_org, votos in concejal_votos_dict.items():
                        if votos > 0:
                            cursor.execute("""
                                INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad)
                                VALUES (%s, %s, %s)
                            """, (id_acta_concejal, id_org, votos))
                    
                    cursor.close()
                    return {
                        "message": "✅ Ambas actas registradas exitosamente",
                        "id_acta_gobernador": id_acta_gobernador,
                        "id_acta_concejal": id_acta_concejal
                    }
                    
            except HTTPException:
                raise
            except Exception as e:
                last_error = e
                print(f"⚠️ Intento {attempt + 1}/{max_retries} fallido: {str(e)}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(1)
                    continue
                else:
                    break
        
        # Si llegamos aquí, todos los intentos fallaron
        error_msg = str(last_error) if last_error else "Error desconocido"
        print(f"❌ Error después de {max_retries} intentos: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error al guardar actas: {error_msg}")
    
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error general en guardar_dual_papeleta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== GUARDAR TRES PAPELETAS SIMULTANEAMENTE ==========
@router.post("/escrutinio/triple-papeleta")
async def guardar_triple_papeleta(
    id_mesa: int = Form(...),
    observaciones: Optional[str] = Form(None),
    user_id: int = Form(...),
    gobernador_codigo_acta: str = Form(...),
    gobernador_cargo: int = Form(...),
    gobernador_blancos: int = Form(...),
    gobernador_nulos: int = Form(...),
    gobernador_votos: str = Form(...),
    alcalde_codigo_acta: str = Form(...),
    alcalde_cargo: int = Form(...),
    alcalde_blancos: int = Form(...),
    alcalde_nulos: int = Form(...),
    alcalde_votos: str = Form(...),
    concejal_codigo_acta: str = Form(...),
    concejal_cargo: int = Form(...),
    concejal_blancos: int = Form(...),
    concejal_nulos: int = Form(...),
    concejal_votos: str = Form(...),
    f_acta: UploadFile = File(None),
    f_h_trabajo: UploadFile = File(None)
):
    """Guarda TRES actas simultáneamente: Gobernador, Alcalde y Concejal"""
    try:
        import json
        
        # Parse JSON strings
        gobernador_votos_dict = json.loads(gobernador_votos)
        alcalde_votos_dict = json.loads(alcalde_votos)
        concejal_votos_dict = json.loads(concejal_votos)
        
        # Leer archivos si existen
        f_acta_bin = await f_acta.read() if f_acta else None
        f_h_trabajo_bin = await f_h_trabajo.read() if f_h_trabajo else None
        
        # Validaciones
        if not gobernador_codigo_acta or not gobernador_codigo_acta.strip():
            raise HTTPException(status_code=400, detail="El código de acta de Gobernador no puede estar vacío")
        if not alcalde_codigo_acta or not alcalde_codigo_acta.strip():
            raise HTTPException(status_code=400, detail="El código de acta de Alcalde no puede estar vacío")
        if not concejal_codigo_acta or not concejal_codigo_acta.strip():
            raise HTTPException(status_code=400, detail="El código de acta de Concejal no puede estar vacío")
        
        gobernador_codigo = gobernador_codigo_acta.strip()
        alcalde_codigo = alcalde_codigo_acta.strip()
        concejal_codigo = concejal_codigo_acta.strip()
        
        max_retries = 2
        last_error = None
        
        for attempt in range(max_retries):
            try:
                with DatabaseConnection() as conn:
                    if not conn:
                        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
                    
                    cursor = conn.cursor()
                    
                    # Validar que los codigos no estén duplicados
                    cursor.execute("SELECT id_acta FROM actas WHERE codigo_acta IN (%s, %s, %s)", 
                                  (gobernador_codigo, alcalde_codigo, concejal_codigo))
                    if cursor.fetchone():
                        raise HTTPException(status_code=400, detail="Uno o más códigos de acta ya están registrados")
                    
                    # PAPELETA 1: GOBERNADOR (SUBNACIONAL)
                    cursor.execute("""
                        INSERT INTO actas (
                            id_mesa, tipo_papeleta, codigo_acta, votos_blancos, votos_nulos,
                            observaciones, usuario_registro
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        id_mesa,
                        'SUBNACIONAL',
                        gobernador_codigo,
                        gobernador_blancos,
                        gobernador_nulos,
                        observaciones,
                        user_id
                    ))
                    
                    id_acta_gobernador = cursor.lastrowid
                    
                    # Insertar votos de Gobernador
                    for id_org, votos in gobernador_votos_dict.items():
                        if votos > 0:
                            cursor.execute("""
                                INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad)
                                VALUES (%s, %s, %s)
                            """, (id_acta_gobernador, id_org, votos))
                    
                    # PAPELETA 2: ALCALDE (MUNICIPAL)
                    cursor.execute("""
                        INSERT INTO actas (
                            id_mesa, tipo_papeleta, codigo_acta, votos_blancos, votos_nulos,
                            observaciones, usuario_registro
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        id_mesa,
                        'MUNICIPAL',
                        alcalde_codigo,
                        alcalde_blancos,
                        alcalde_nulos,
                        observaciones,
                        user_id
                    ))
                    
                    id_acta_alcalde = cursor.lastrowid
                    
                    # Insertar votos de Alcalde
                    for id_org, votos in alcalde_votos_dict.items():
                        if votos > 0:
                            cursor.execute("""
                                INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad)
                                VALUES (%s, %s, %s)
                            """, (id_acta_alcalde, id_org, votos))
                    
                    # PAPELETA 3: CONCEJAL (MUNICIPAL)
                    cursor.execute("""
                        INSERT INTO actas (
                            id_mesa, tipo_papeleta, codigo_acta, votos_blancos, votos_nulos,
                            observaciones, usuario_registro
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        id_mesa,
                        'MUNICIPAL',
                        concejal_codigo,
                        concejal_blancos,
                        concejal_nulos,
                        observaciones,
                        user_id
                    ))
                    
                    id_acta_concejal = cursor.lastrowid
                    
                    # Insertar votos de Concejal
                    for id_org, votos in concejal_votos_dict.items():
                        if votos > 0:
                            cursor.execute("""
                                INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad)
                                VALUES (%s, %s, %s)
                            """, (id_acta_concejal, id_org, votos))
                    
                    cursor.close()
                    return {
                        "message": "✅ Las tres actas registradas exitosamente",
                        "id_acta_gobernador": id_acta_gobernador,
                        "id_acta_alcalde": id_acta_alcalde,
                        "id_acta_concejal": id_acta_concejal
                    }
                    
            except HTTPException:
                raise
            except Exception as e:
                last_error = e
                print(f"⚠️ Intento {attempt + 1}/{max_retries} fallido: {str(e)}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(1)
                    continue
                else:
                    break
        
        # Si llegamos aquí, todos los intentos fallaron
        error_msg = str(last_error) if last_error else "Error desconocido"
        print(f"❌ Error después de {max_retries} intentos: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error al guardar actas: {error_msg}")
    
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error general en guardar_triple_papeleta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== OBTENER VOTOS DETALLE POR ACTA ==========
@router.get("/votos_detalle/acta/{id_acta}")
async def obtener_votos_detalle_acta(id_acta: int):
    """Obtiene el desglose de votos por organización para una acta específica."""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

            cursor = conn.cursor(dictionary=True)

            # Obtener votos detalle para la acta específica
            cursor.execute("""
                SELECT
                    op.nombre,
                    op.sigla,
                    vd.votos_cantidad,
                    vd.tipo_voto
                FROM votos_detalle vd
                JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                WHERE vd.id_acta = %s
                ORDER BY vd.votos_cantidad DESC
            """, (id_acta,))

            votos_detalle = cursor.fetchall()

            cursor.close()
            return votos_detalle

    except Exception as e:
        print(f"❌ Error al obtener votos detalle: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== ELIMINAR TODOS LOS VOTOS DE UN ACTA ==========
@router.delete("/votos_detalle/acta/{id_acta}/all")
async def eliminar_todos_votos_acta(id_acta: int):
    """Elimina todos los votos de una acta específica."""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

            cursor = conn.cursor()
            cursor.execute("DELETE FROM votos_detalle WHERE id_acta = %s", (id_acta,))
            conn.commit()
            cursor.close()

            return {"message": "Votos eliminados exitosamente", "id_acta": id_acta}

    except Exception as e:
        print(f"❌ Error al eliminar votos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== CREAR VOTO DETALLE ==========
@router.post("/votos_detalle")
async def crear_voto_detalle(id_acta: int, id_organizacion: int, votos_cantidad: int, tipo_voto: str):
    """Crea un voto detalle para una organización en una acta."""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad, tipo_voto)
                VALUES (%s, %s, %s, %s)
            """, (id_acta, id_organizacion, votos_cantidad, tipo_voto))
            conn.commit()
            cursor.close()

            return {"message": "Voto registrado exitosamente"}

    except Exception as e:
        print(f"❌ Error al crear voto detalle: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== OBTENER IMÁGENES DE ACTA POR ACTA ==========
@router.get("/fotos_acta/acta/{id_acta}")
async def obtener_fotos_acta(id_acta: int):
    """Obtiene las imágenes de acta para una acta específica."""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

            cursor = conn.cursor(dictionary=True)
            
            try:
                # Intentar obtener imágenes directamente de la tabla actas
                # Las imágenes están almacenadas como binario en f_acta y f_h_trabajo
                cursor.execute("""
                    SELECT 
                        id_acta,
                        f_acta,
                        f_h_trabajo
                    FROM actas
                    WHERE id_acta = %s
                """, (id_acta,))
                
                result = cursor.fetchone()
                
                fotos_acta = []
                
                # Si hay datos de imagen en f_acta, procesarlos
                if result and result['f_acta']:
                    # Si el campo f_acta contiene datos binarios, crear una URL base64
                    imagen_data = result['f_acta']
                    if imagen_data:  # Si hay datos en el campo
                        # Verificar si es una URL ya existente o datos binarios
                        if isinstance(imagen_data, str) and (imagen_data.startswith('http') or imagen_data.startswith('/')):
                            # Es una URL existente
                            url_imagen = imagen_data
                        else:
                            # Es datos binarios, convertir a base64
                            import base64
                            if isinstance(imagen_data, bytes):
                                # Convertir datos binarios a base64
                                imagen_base64 = base64.b64encode(imagen_data).decode('utf-8')
                                # Determinar el tipo MIME según la cabecera del archivo
                                if imagen_data.startswith(b'\x89PNG'):
                                    mime_type = 'image/png'
                                elif imagen_data.startswith(b'\xff\xd8\xff'):
                                    mime_type = 'image/jpeg'
                                elif imagen_data.startswith(b'GIF'):
                                    mime_type = 'image/gif'
                                elif imagen_data.startswith(b'\x89\x50\x4E\x47'):
                                    mime_type = 'image/png'
                                else:
                                    mime_type = 'application/octet-stream'  # Tipo genérico
                                
                                url_imagen = f"data:{mime_type};base64,{imagen_base64}"
                            else:
                                # Si no es binario ni string con URL, no podemos procesarlo
                                url_imagen = None
                        
                        if url_imagen:
                            fotos_acta.append({
                                'id_foto_acta': result['id_acta'],
                                'id_acta': result['id_acta'],
                                'url_imagen': url_imagen,
                                'fecha_registro': None  # No tenemos fecha específica para la imagen
                            })
                
                # Si no encontramos imágenes en la tabla actas, intentar buscar en tablas relacionadas
                try:
                    cursor.execute("""
                        SELECT 
                            id_foto_acta,
                            id_acta,
                            url_imagen,
                            fecha_registro
                        FROM fotos_acta
                        WHERE id_acta = %s
                    """, (id_acta,))
                    
                    additional_fotos = cursor.fetchall()
                    for foto in additional_fotos:
                        fotos_acta.append({
                            'id_foto_acta': foto['id_foto_acta'],
                            'id_acta': foto['id_acta'],
                            'url_imagen': foto['url_imagen'],
                            'fecha_registro': foto['fecha_registro']
                        })
                except:
                    # Si la tabla fotos_acta no existe, continuar sin imágenes
                    pass
                
            except Exception as db_error:
                # Si hay un error con la consulta (por ejemplo, campos no existen), devolver array vacío
                print(f"⚠️ Error en la consulta de imágenes de acta: {str(db_error)}")
                fotos_acta = []
            
            cursor.close()
            return fotos_acta

    except Exception as e:
        print(f"❌ Error al obtener fotos de acta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== OBTENER IMÁGENES DE HOJA DE TRABAJO POR ACTA ==========
@router.get("/fotos_h_trabajo/acta/{id_acta}")
async def obtener_fotos_h_trabajo(id_acta: int):
    """Obtiene las imágenes de hoja de trabajo para una acta específica."""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

            cursor = conn.cursor(dictionary=True)
            
            try:
                # Intentar obtener imágenes directamente de la tabla actas
                # Usando solo columnas que sabemos que existen
                cursor.execute("""
                    SELECT 
                        id_acta,
                        f_acta,
                        f_h_trabajo
                    FROM actas
                    WHERE id_acta = %s
                """, (id_acta,))
                
                result = cursor.fetchone()
                
                fotos_h_trabajo = []
                
                # Si hay datos de imagen en f_h_trabajo, procesarlos
                if result and result['f_h_trabajo']:
                    # Si el campo f_h_trabajo contiene datos binarios, crear una URL base64
                    imagen_data = result['f_h_trabajo']
                    if imagen_data:  # Si hay datos en el campo
                        # Verificar si es una URL ya existente o datos binarios
                        if isinstance(imagen_data, str) and (imagen_data.startswith('http') or imagen_data.startswith('/')):
                            # Es una URL existente
                            url_imagen = imagen_data
                        else:
                            # Es datos binarios, convertir a base64
                            import base64
                            if isinstance(imagen_data, bytes):
                                # Convertir datos binarios a base64
                                imagen_base64 = base64.b64encode(imagen_data).decode('utf-8')
                                # Determinar el tipo MIME según la cabecera del archivo
                                if imagen_data.startswith(b'\x89PNG'):
                                    mime_type = 'image/png'
                                elif imagen_data.startswith(b'\xff\xd8\xff'):
                                    mime_type = 'image/jpeg'
                                elif imagen_data.startswith(b'GIF'):
                                    mime_type = 'image/gif'
                                elif imagen_data.startswith(b'\x89\x50\x4E\x47'):
                                    mime_type = 'image/png'
                                else:
                                    mime_type = 'application/octet-stream'  # Tipo genérico
                                
                                url_imagen = f"data:{mime_type};base64,{imagen_base64}"
                            else:
                                # Si no es binario ni string con URL, no podemos procesarlo
                                url_imagen = None
                        
                        if url_imagen:
                            fotos_h_trabajo.append({
                                'id_foto_h_trabajo': result['id_acta'],
                                'id_acta': result['id_acta'],
                                'url_imagen': url_imagen,
                                'fecha_registro': None  # No tenemos fecha específica para la imagen
                            })
                
                # Si no encontramos imágenes en la tabla actas, intentar buscar en tablas relacionadas
                try:
                    cursor.execute("""
                        SELECT 
                            id_foto_h_trabajo,
                            id_acta,
                            url_imagen,
                            fecha_registro
                        FROM fotos_h_trabajo
                        WHERE id_acta = %s
                    """, (id_acta,))
                    
                    additional_fotos = cursor.fetchall()
                    for foto in additional_fotos:
                        fotos_h_trabajo.append({
                            'id_foto_h_trabajo': foto['id_foto_h_trabajo'],
                            'id_acta': foto['id_acta'],
                            'url_imagen': foto['url_imagen'],
                            'fecha_registro': foto['fecha_registro']
                        })
                except:
                    # Si la tabla fotos_h_trabajo no existe, continuar sin imágenes
                    pass
                
            except Exception as db_error:
                # Si hay un error con la consulta (por ejemplo, campos no existen), devolver array vacío
                print(f"⚠️ Error en la consulta de imágenes de hoja de trabajo: {str(db_error)}")
                fotos_h_trabajo = []
            
            cursor.close()
            return fotos_h_trabajo

    except Exception as e:
        print(f"❌ Error al obtener fotos de hoja de trabajo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# NUEVO ENDPOINT: ACTA GOBERNACIÓN (Solo Gobernador)
# ============================================================================
@router.post("/escrutinio/gobernacion")
async def guardar_acta_gobernacion(
    id_mesa: int = Form(...),
    codigo_acta: str = Form(...),
    total_actas: int = Form(...),
    id_cargo_gobernador: int = Form(...),
    id_cargo_asambl_poblacion: int = Form(...),
    id_cargo_asambl_territorio: int = Form(...),
    tipo_papeleta_gobernador: str = Form(...),
    tipo_papeleta_asambl_poblacion: str = Form(...),
    tipo_papeleta_asambl_territorio: str = Form(...),
    votos_blancos_gobernador: int = Form(...),
    votos_nulos_gobernador: int = Form(...),
    votos_blancos_asambl_poblacion: int = Form(...),
    votos_nulos_asambl_poblacion: int = Form(...),
    votos_blancos_asambl_territorio: int = Form(...),
    votos_nulos_asambl_territorio: int = Form(...),
    observaciones: Optional[str] = Form(None),
    user_id: int = Form(...),
    votos_partidos_gobernador: str = Form(...),
    votos_partidos_asambl_poblacion: str = Form(...),
    votos_partidos_asambl_territorio: str = Form(...),
    f_acta: UploadFile = File(None),
    f_h_trabajo: UploadFile = File(None)
):
    """
    Guarda una ÚNICA acta de escrutinio que registra las tres votaciones:
    - GOBERNADOR (LIBRE_GOB)
    - ASAMBLISTA POR POBLACIÓN (LIBRE_A_R)
    - ASAMBLISTA POR TERRITORIO (LIBRE_A_T)
    
    Todos los votos se registran bajo el MISMO codigo_acta
    """
    try:
        import json
        votos_gobernador = json.loads(votos_partidos_gobernador)
        votos_asambl_poblacion = json.loads(votos_partidos_asambl_poblacion)
        votos_asambl_territorio = json.loads(votos_partidos_asambl_territorio)

        f_acta_data = await f_acta.read() if f_acta else None
        f_h_trabajo_data = await f_h_trabajo.read() if f_h_trabajo else None

        max_retries = 2
        last_error = None
        
        for attempt in range(max_retries):
            try:
                with DatabaseConnection() as conn:
                    if not conn:
                        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

                    cursor = conn.cursor()

                    # Validar que el código de acta sea único
                    check_query = "SELECT id_acta FROM actas WHERE codigo_acta = %s"
                    cursor.execute(check_query, (codigo_acta.strip(),))
                    if cursor.fetchone():
                        cursor.close()
                        raise HTTPException(status_code=400, detail="❌ El código de acta ya existe")

                    # CREAR UNA SOLA ACTA que registre los 3 cargos
                    acta_query = """
                        INSERT INTO actas (
                            id_mesa, codigo_acta, tipo_papeleta, observaciones, usuario_registro, total_actas,
                            f_acta, f_h_trabajo,
                            id_cargo_gob, id_cargo_asam_pob, id_cargo_asam_terr,
                            votos_blancos_g, votos_nulos_g,
                            votos_blancos_p, votos_nulos_p,
                            votos_blancos_t, votos_nulos_t,
                            id_cargo_alca, id_cargo_cons, id_cargo_asa,
                            votos_blancos_a, votos_nulos_a,
                            votos_blancos_c, votos_nulos_c
                        )
                        VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s
                        )
                    """
                    
                    cursor.execute(acta_query, (
                        id_mesa, codigo_acta.strip(), tipo_papeleta_gobernador, 
                        observaciones or '', user_id, total_actas,
                        f_acta_data, f_h_trabajo_data,
                        # Gobernacion values
                        id_cargo_gobernador, id_cargo_asambl_poblacion, id_cargo_asambl_territorio,
                        votos_blancos_gobernador, votos_nulos_gobernador,
                        votos_blancos_asambl_poblacion, votos_nulos_asambl_poblacion,
                        votos_blancos_asambl_territorio, votos_nulos_asambl_territorio,
                        # Municipal values set to None
                        None, None, None,
                        None, None,
                        None, None
                    ))

                    id_acta = cursor.lastrowid

                    # Insertar votos GOBERNADOR (LIBRE_GOB)
                    for id_org, votos in votos_gobernador.items():
                        if votos > 0:
                            votos_query = """
                                INSERT INTO votos_detalle
                                (id_acta, id_organizacion, votos_cantidad, tipo_voto)
                                VALUES (%s, %s, %s, %s)
                            """
                            cursor.execute(votos_query, (id_acta, int(id_org), int(votos), 'GOBERNADOR'))

                    # Insertar votos ASAMBLISTA POBLACIÓN (LIBRE_A_R)
                    for id_org, votos in votos_asambl_poblacion.items():
                        if votos > 0:
                            votos_query = """
                                INSERT INTO votos_detalle
                                (id_acta, id_organizacion, votos_cantidad, tipo_voto)
                                VALUES (%s, %s, %s, %s)
                            """
                            cursor.execute(votos_query, (id_acta, int(id_org), int(votos), 'ASAMBLISTA_POBLACION'))

                    # Insertar votos ASAMBLISTA TERRITORIO (LIBRE_A_T)
                    for id_org, votos in votos_asambl_territorio.items():
                        if votos > 0:
                            votos_query = """
                                INSERT INTO votos_detalle
                                (id_acta, id_organizacion, votos_cantidad, tipo_voto)
                                VALUES (%s, %s, %s, %s)
                            """
                            cursor.execute(votos_query, (id_acta, int(id_org), int(votos), 'ASAMBLISTA_TERRITORIO'))

                    conn.commit()
                    cursor.close()
                    
                    return {
                        "message": "✅ Acta única registrada con Gobernador + Asamblistas (Población y Territorio)",
                        "id_acta": id_acta,
                        "codigo_acta": codigo_acta.strip()
                    }
                    
            except HTTPException:
                raise
            except Exception as e:
                last_error = e
                print(f"⚠️ Intento {attempt + 1}/{max_retries} fallido: {str(e)}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(1)
                    continue
                else:
                    break
        
        error_msg = str(last_error) if last_error else "Error desconocido"
        print(f"❌ Error después de {max_retries} intentos: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error al guardar acta: {error_msg}")
    
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error general en guardar_acta_gobernacion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# NUEVO ENDPOINT: ACTA MUNICIPAL (Alcalde + Concejal en MISMA acta)
# ============================================================================
@router.post("/escrutinio/municipal")
async def guardar_acta_municipal(
    id_mesa: int = Form(...),
    codigo_acta: str = Form(...),
    total_actas: int = Form(...),
    id_cargo_alcalde: int = Form(...),
    id_cargo_concejal: int = Form(...),
    votos_blancos_alcalde: int = Form(...),
    votos_nulos_alcalde: int = Form(...),
    votos_blancos_concejal: int = Form(...),
    votos_nulos_concejal: int = Form(...),
    observaciones: Optional[str] = Form(None),
    user_id: int = Form(...),
    votos_alcalde: str = Form(...),  # JSON string
    votos_concejal: str = Form(...),  # JSON string
    f_acta: List[UploadFile] = File(None),  # Múltiples imágenes
    f_h_trabajo: List[UploadFile] = File(None)  # Múltiples imágenes
):
    """
    Guarda una acta municipal ÚNICA para ALCALDE + CONCEJAL
    - Un solo codigo_acta
    - Votos separados para cada cargo por organización
    - Registra cargo_id en la acta para cada votación
    - Soporta múltiples imágenes que se suben a Google Drive
    """
    try:
        import json
        votos_alcalde_dict = json.loads(votos_alcalde)
        votos_concejal_dict = json.loads(votos_concejal)

        # Procesar múltiples imágenes de acta
        f_acta_filenames = []
        if f_acta:
            acta_images_data = []
            for file in f_acta:
                if file and file.filename:
                    image_data = await file.read()
                    acta_images_data.append(image_data)
            
            # Subir a Google Drive y obtener nombres de archivos
            if acta_images_data:
                from image_upload_service import upload_acta_images
                f_acta_filenames = upload_acta_images(acta_images_data, codigo_acta.strip())
        
        # Procesar múltiples imágenes de hoja de trabajo
        f_h_trabajo_filenames = []
        if f_h_trabajo:
            hoja_images_data = []
            for file in f_h_trabajo:
                if file and file.filename:
                    image_data = await file.read()
                    hoja_images_data.append(image_data)
            
            # Subir a Google Drive y obtener nombres de archivos
            if hoja_images_data:
                from image_upload_service import upload_hoja_trabajo_images
                f_h_trabajo_filenames = upload_hoja_trabajo_images(hoja_images_data, codigo_acta.strip())
        
        # Convertir listas a strings separados por coma para la BD
        f_acta_str = ','.join(f_acta_filenames) if f_acta_filenames else None
        f_h_trabajo_str = ','.join(f_h_trabajo_filenames) if f_h_trabajo_filenames else None

        max_retries = 2
        last_error = None

        for attempt in range(max_retries):
            try:
                with DatabaseConnection() as conn:
                    if not conn:
                        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

                    cursor = conn.cursor()

                    # Validar que el código de acta sea único
                    check_query = "SELECT id_acta FROM actas WHERE codigo_acta = %s"
                    cursor.execute(check_query, (codigo_acta.strip(),))
                    if cursor.fetchone():
                        cursor.close()
                        raise HTTPException(status_code=400, detail=f"Código de acta '{codigo_acta.strip()}' ya está registrado")

                    # CREAR UNA ACTA MUNICIPAL CON AMBOS CARGOS
                    acta_query = """
                        INSERT INTO actas (
                            id_mesa, codigo_acta, tipo_papeleta, observaciones, usuario_registro, total_actas,
                            f_acta, f_h_trabajo,
                            id_cargo_alca, id_cargo_cons,
                            votos_blancos_a, votos_nulos_a,
                            votos_blancos_c, votos_nulos_c,
                            id_cargo_gob, id_cargo_asam_pob, id_cargo_asam_terr, id_cargo_asa,
                            votos_blancos_g, votos_nulos_g,
                            votos_blancos_t, votos_nulos_t,
                            votos_blancos_p, votos_nulos_p
                        )
                        VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s
                        )
                    """

                    cursor.execute(acta_query, (
                        id_mesa, codigo_acta.strip(), 'MUNICIPAL',
                        observaciones or '', user_id, total_actas,
                        f_acta_str, f_h_trabajo_str,  # Nombres de archivos (strings separados por coma)
                        # Municipal values
                        id_cargo_alcalde, id_cargo_concejal,
                        votos_blancos_alcalde, votos_nulos_alcalde,
                        votos_blancos_concejal, votos_nulos_concejal,
                        # Gobernacion values set to None
                        None, None, None, None,
                        None, None,
                        None, None,
                        None, None
                    ))
                    id_acta = cursor.lastrowid

                    # Insertar votos de ALCALDE
                    for id_org, votos in votos_alcalde_dict.items():
                        if votos > 0:
                            votos_query = """
                                INSERT INTO votos_detalle
                                (id_acta, id_organizacion, votos_cantidad, tipo_voto)
                                VALUES (%s, %s, %s, %s)
                            """
                            cursor.execute(votos_query, (id_acta, int(id_org), int(votos), 'ALCALDE'))

                    # Insertar votos de CONCEJAL
                    for id_org, votos in votos_concejal_dict.items():
                        if votos > 0:
                            votos_query = """
                                INSERT INTO votos_detalle
                                (id_acta, id_organizacion, votos_cantidad, tipo_voto)
                                VALUES (%s, %s, %s, %s)
                            """
                            cursor.execute(votos_query, (id_acta, int(id_org), int(votos), 'CONCEJAL'))

                    conn.commit()
                    cursor.close()

                    return {
                        "message": "✅ Acta Municipal (Alcalde y Concejal) registrada exitosamente",
                        "id_acta": id_acta,
                        "codigo_acta": codigo_acta.strip(),
                        "f_acta": f_acta_str,
                        "f_h_trabajo": f_h_trabajo_str
                    }

            except HTTPException:
                raise
            except Exception as e:
                last_error = e
                print(f"⚠️ Intento {attempt + 1}/{max_retries} fallido: {str(e)}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(1)
                    continue
                else:
                    break

        error_msg = str(last_error) if last_error else "Error desconocido"
        print(f"❌ Error después de {max_retries} intentos: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error al guardar acta: {error_msg}")

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error general en guardar_acta_municipal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== NUEVO ENDPOINT: ESCRUTINIO GENERAL (Municipal + Gobernación) ==========
@router.post("/escrutinio/general")
async def guardar_escrutinio_general(
    id_mesa: int = Form(...),
    codigo_acta: str = Form(...),
    total_actas: int = Form(...),
    observaciones: Optional[str] = Form(None),
    user_id: int = Form(...),
    tipo_escrutinio: str = Form('AMBOS'),
    id_cargo_alcalde: Optional[int] = Form(None),
    id_cargo_concejal: Optional[int] = Form(None),
    votos_blancos_alcalde: Optional[int] = Form(0),
    votos_nulos_alcalde: Optional[int] = Form(0),
    votos_blancos_concejal: Optional[int] = Form(0),
    votos_nulos_concejal: Optional[int] = Form(0),
    votos_alcalde: Optional[str] = Form(None),
    votos_concejal: Optional[str] = Form(None),
    id_cargo_gobernador: Optional[int] = Form(None),
    id_cargo_gob: Optional[int] = Form(None),
    id_cargo_asam_pob: Optional[int] = Form(None),
    id_cargo_asam_terr: Optional[int] = Form(None),
    votos_blancos_gobernador: Optional[int] = Form(0),
    votos_nulos_gobernador: Optional[int] = Form(0),
    votos_blancos_asam_pob: Optional[int] = Form(0),
    votos_nulos_asam_pob: Optional[int] = Form(0),
    votos_blancos_asam_terr: Optional[int] = Form(0),
    votos_nulos_asam_terr: Optional[int] = Form(0),
    votos_gobernador: Optional[str] = Form(None),
    votos_asam_pob: Optional[str] = Form(None),
    votos_asam_terr: Optional[str] = Form(None),
    f_acta: List[UploadFile] = File(None),
    f_h_trabajo: List[UploadFile] = File(None)
):
    """Guarda actas de Municipal Y/O Gobernación en un solo formulario"""
    try:
        import json

        votos_alcalde_dict = json.loads(votos_alcalde) if votos_alcalde else {}
        votos_concejal_dict = json.loads(votos_concejal) if votos_concejal else {}
        votos_gobernador_dict = json.loads(votos_gobernador) if votos_gobernador else {}
        votos_asam_pob_dict = json.loads(votos_asam_pob) if votos_asam_pob else {}
        votos_asam_terr_dict = json.loads(votos_asam_terr) if votos_asam_terr else {}

        # Procesar imágenes
        f_acta_filenames = []
        f_h_trabajo_filenames = []
        
        if f_acta:
            acta_images_data = [await file.read() for file in f_acta if file and file.filename]
            if acta_images_data:
                from image_upload_service import upload_acta_images
                f_acta_filenames = upload_acta_images(acta_images_data, codigo_acta.strip())
        
        if f_h_trabajo:
            hoja_images_data = [await file.read() for file in f_h_trabajo if file and file.filename]
            if hoja_images_data:
                from image_upload_service import upload_hoja_trabajo_images
                f_h_trabajo_filenames = upload_hoja_trabajo_images(hoja_images_data, codigo_acta.strip())
        
        f_acta_str = ','.join(f_acta_filenames) if f_acta_filenames else None
        f_h_trabajo_str = ','.join(f_h_trabajo_filenames) if f_h_trabajo_filenames else None

        max_retries = 2
        last_error = None

        for attempt in range(max_retries):
            try:
                with DatabaseConnection() as conn:
                    if not conn:
                        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

                    cursor = conn.cursor()

                    # Validar código único
                    cursor.execute("SELECT id_acta FROM actas WHERE codigo_acta = %s", (codigo_acta.strip(),))
                    if cursor.fetchone():
                        raise HTTPException(status_code=400, detail=f"Código '{codigo_acta.strip()}' ya registrado")

                    tipo_papeleta = 'GENERAL' if tipo_escrutinio == 'AMBOS' else ('MUNICIPAL' if tipo_escrutinio == 'SOLO_MUNICIPAL' else 'SUBNACIONAL')

                    cursor.execute("""
                        INSERT INTO actas (
                            id_mesa, codigo_acta, tipo_papeleta, observaciones, usuario_registro, total_actas,
                            f_acta, f_h_trabajo,
                            id_cargo_alca, id_cargo_cons, votos_blancos_a, votos_nulos_a,
                            votos_blancos_c, votos_nulos_c,
                            id_cargo_gob, id_cargo_asam_pob, id_cargo_asam_terr,
                            votos_blancos_g, votos_nulos_g,
                            votos_blancos_p, votos_nulos_p,
                            votos_blancos_t, votos_nulos_t
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        id_mesa, codigo_acta.strip(), tipo_papeleta, observaciones or '', user_id, total_actas,
                        f_acta_str, f_h_trabajo_str,
                        id_cargo_alcalde, id_cargo_concejal, votos_blancos_alcalde, votos_nulos_alcalde,
                        votos_blancos_concejal, votos_nulos_concejal,
                        id_cargo_gob, id_cargo_asam_pob, id_cargo_asam_terr,
                        votos_blancos_gobernador, votos_nulos_gobernador,
                        votos_blancos_asam_pob, votos_nulos_asam_pob,
                        votos_blancos_asam_terr, votos_nulos_asam_terr
                    ))
                    id_acta = cursor.lastrowid

                    # Insertar votos MUNICIPALES
                    if tipo_escrutinio in ['AMBOS', 'SOLO_MUNICIPAL']:
                        for id_org, votos in votos_alcalde_dict.items():
                            if votos > 0:
                                cursor.execute("INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad, tipo_voto) VALUES (%s, %s, %s, 'ALCALDE')", (id_acta, int(id_org), int(votos)))
                        for id_org, votos in votos_concejal_dict.items():
                            if votos > 0:
                                cursor.execute("INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad, tipo_voto) VALUES (%s, %s, %s, 'CONCEJAL')", (id_acta, int(id_org), int(votos)))

                    # Insertar votos GOBERNACION
                    if tipo_escrutinio in ['AMBOS', 'SOLO_GOBERNACION']:
                        for id_org, votos in votos_gobernador_dict.items():
                            if votos > 0:
                                cursor.execute("INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad, tipo_voto) VALUES (%s, %s, %s, 'GOBERNADOR')", (id_acta, int(id_org), int(votos)))
                        for id_org, votos in votos_asam_pob_dict.items():
                            if votos > 0:
                                cursor.execute("INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad, tipo_voto) VALUES (%s, %s, %s, 'ASAMBLEISTA_POBLACION')", (id_acta, int(id_org), int(votos)))
                        for id_org, votos in votos_asam_terr_dict.items():
                            if votos > 0:
                                cursor.execute("INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad, tipo_voto) VALUES (%s, %s, %s, 'ASAMBLEISTA_TERRITORIO')", (id_acta, int(id_org), int(votos)))

                    conn.commit()
                    cursor.close()

                    return {"message": "✅ Acta General registrada", "id_acta": id_acta, "tipo_escrutinio": tipo_escrutinio}

            except HTTPException:
                raise
            except Exception as e:
                last_error = e
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                break

        raise HTTPException(status_code=500, detail=str(last_error) if last_error else "Error al guardar")

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error en guardar_escrutinio_general: {e}")
        raise HTTPException(status_code=500, detail=str(e))