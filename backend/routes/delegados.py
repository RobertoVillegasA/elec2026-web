# backend/routes/delegados.py
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from db import DatabaseConnection
from pydantic import BaseModel
from typing import Optional
import bcrypt
import pandas as pd
import io

router = APIRouter()

class DelegadoSchema(BaseModel):
    nombre: str
    apellido: str
    ci: str
    telefono: str = ""
    direccion: str
    id_organizacion: Optional[int] = None
    id_mesa: Optional[int] = None
    id_rol: Optional[int] = 6  # Por defecto Delegado
    id_recinto: Optional[int] = None
    id_distrito: Optional[int] = None

@router.get("/delegados/listar")
def listar_delegados(
    departamento: int = Query(None),
    provincia: int = Query(None),
    municipio: int = Query(None),
    recinto: int = Query(None),
    organizacion: int = Query(None),
    id_rol: int = Query(None)  # Filtro por rol (4=Coord_distrito, 5=Coord_recinto, 6=Delegado)
):
    """Lista delegados con filtros geográficos y por rol."""
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
                    d.id_rol,
                    d.id_recinto,
                    d.id_distrito,
                    r.nombre_rol,
                    o.sigla AS organizacion_sigla,
                    m.numero_mesa,
                    rec.id_recinto,
                    rec.nombre AS recinto,
                    dt.nro_distrito,
                    mu.id_municipio,
                    mu.nombre AS municipio,
                    p.id_provincia,
                    p.nombre AS provincia,
                    dep.id_departamento,
                    dep.nombre AS departamento
                FROM delegados d
                LEFT JOIN roles r ON d.id_rol = r.id_rol
                LEFT JOIN organizaciones_politicas o ON d.id_organizacion = o.id_organizacion
                LEFT JOIN mesas m ON d.id_mesa = m.id_mesa
                LEFT JOIN recintos rec ON m.id_recinto = rec.id_recinto
                LEFT JOIN distritos dt ON d.id_distrito = dt.id_distrito
                LEFT JOIN municipios mu ON rec.id_municipio = mu.id_municipio
                LEFT JOIN provincias p ON mu.id_provincia = p.id_provincia
                LEFT JOIN departamentos dep ON p.id_departamento = dep.id_departamento
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
                query += " AND rec.id_recinto = %s"
                params.append(recinto)
            if organizacion is not None:
                query += " AND d.id_organizacion = %s"
                params.append(organizacion)
            if id_rol is not None:
                query += " AND d.id_rol = %s"
                params.append(id_rol)

            query += " ORDER BY d.id_delegado DESC"

            cursor.execute(query, params)
            delegados = cursor.fetchall()
        return delegados
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cargar delegados: {str(e)}")

@router.post("/delegados")
def crear_delegado(delegado: DelegadoSchema):
    """Registra un nuevo delegado, coordinador de distrito o coordinador de recinto."""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)

            # Validar que el CI no esté registrado
            cursor.execute("SELECT id_delegado FROM delegados WHERE ci = %s", (delegado.ci,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="El CI ya está registrado")

            try:
                # Insertar delegado
                cursor.execute("""
                    INSERT INTO delegados
                    (nombre, apellido, ci, telefono, direccion, id_organizacion, id_mesa, id_rol, id_recinto, id_distrito)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    delegado.nombre,
                    delegado.apellido,
                    delegado.ci,
                    delegado.telefono or '',
                    delegado.direccion or '',
                    delegado.id_organizacion or None,
                    delegado.id_mesa or None,
                    delegado.id_rol or 6,
                    delegado.id_recinto or None,
                    delegado.id_distrito or None
                ))
                delegado_id = cursor.lastrowid
                
                # Crear usuario automáticamente con el rol correspondiente
                nombre_inicial = delegado.nombre[0].lower() if delegado.nombre else ''
                username = f"{delegado.ci}{nombre_inicial}"
                password = f"{delegado.ci}{nombre_inicial}"  # Contraseña por defecto
                
                # Hashear contraseña
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                # Verificar si el usuario ya existe
                cursor.execute("SELECT id_usuario FROM usuarios WHERE username = %s", (username,))
                usuario_existente = cursor.fetchone()
                
                if usuario_existente:
                    # Actualizar rol del usuario existente
                    cursor.execute("""
                        UPDATE usuarios SET id_rol = %s WHERE username = %s
                    """, (delegado.id_rol or 6, username))
                else:
                    # Crear nuevo usuario
                    fullname = f"{delegado.nombre} {delegado.apellido}"
                    cursor.execute("""
                        INSERT INTO usuarios (username, fullname, password_hash, id_rol)
                        VALUES (%s, %s, %s, %s)
                    """, (username, fullname, password_hash, delegado.id_rol or 6))
                
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise HTTPException(status_code=500, detail=f"Error al guardar: {str(e)}")
            
            return {"message": "Registrado exitosamente", "id": delegado_id, "username": username, "password": password}
    raise HTTPException(status_code=500, detail="Error al registrar")

@router.put("/delegados/{id_delegado}")
def editar_delegado(id_delegado: int, delegado: DelegadoSchema):
    """Edita un delegado, coordinador de distrito o coordinador de recinto."""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            
            # Obtener datos actuales del delegado para comparar
            cursor.execute("SELECT ci, nombre, id_rol FROM delegados WHERE id_delegado = %s", (id_delegado,))
            delegado_actual = cursor.fetchone()
            
            if not delegado_actual:
                raise HTTPException(status_code=404, detail="No encontrado")
            
            # Validar que el CI no esté registrado en otro registro
            cursor.execute("SELECT id_delegado FROM delegados WHERE ci = %s AND id_delegado != %s", (delegado.ci, id_delegado))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="El CI ya está registrado")
            
            # Actualizar delegado
            cursor.execute("""
                UPDATE delegados
                SET nombre = %s, apellido = %s, ci = %s, telefono = %s,
                    direccion = %s, id_organizacion = %s, id_mesa = %s,
                    id_rol = %s, id_recinto = %s, id_distrito = %s
                WHERE id_delegado = %s
            """, (
                delegado.nombre,
                delegado.apellido,
                delegado.ci,
                delegado.telefono,
                delegado.direccion,
                delegado.id_organizacion,
                delegado.id_mesa,
                delegado.id_rol,
                delegado.id_recinto,
                delegado.id_distrito,
                id_delegado
            ))
            
            # Si cambió el rol, actualizar también en la tabla de usuarios
            if delegado_actual['id_rol'] != delegado.id_rol:
                # Generar username: CI + inicial del nombre
                nombre_inicial = delegado.nombre[0].lower() if delegado.nombre else ''
                username = f"{delegado.ci}{nombre_inicial}"
                
                # Actualizar rol en usuarios
                cursor.execute("""
                    UPDATE usuarios
                    SET id_rol = %s
                    WHERE username = %s
                """, (delegado.id_rol, username))
            
            if cursor.rowcount > 0:
                conn.commit()
                return {"message": "Actualizado exitosamente"}
    raise HTTPException(status_code=404, detail="No encontrado")

@router.delete("/delegados/eliminar/{id_delegado}")
def eliminar_delegado(id_delegado: int):
    """Elimina un delegado por ID."""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM delegados WHERE id_delegado = %s", (id_delegado,))
            if cursor.rowcount > 0:
                conn.commit()
                return {"message": "Eliminado exitosamente"}
    raise HTTPException(status_code=404, detail="No encontrado")

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
                    d.id_mesa,
                    d.id_rol,
                    d.id_recinto,
                    d.id_distrito,
                    r.nombre_rol,
                    o.sigla AS organizacion_sigla,
                    m.numero_mesa,
                    dt.nro_distrito
                FROM delegados d
                LEFT JOIN roles r ON d.id_rol = r.id_rol
                LEFT JOIN organizaciones_politicas o ON d.id_organizacion = o.id_organizacion
                LEFT JOIN mesas m ON d.id_mesa = m.id_mesa
                LEFT JOIN distritos dt ON d.id_distrito = dt.id_distrito
                WHERE d.id_delegado = %s
            """, (id_delegado,))
            result = cursor.fetchone()
            if result:
                return result
    raise HTTPException(status_code=404, detail="No encontrado")

@router.post("/delegados/carga-masiva")
async def carga_masiva_delegados(file: UploadFile = File(...)):
    """Carga masiva de delegados desde un archivo Excel."""
    try:
        # Verificar que el archivo sea un Excel
        if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
            raise HTTPException(status_code=400, detail="El archivo debe ser un archivo Excel (.xlsx o .xls)")
        
        # Leer el contenido del archivo
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validar columnas requeridas
        required_columns = ['nombre', 'apellido', 'ci', 'telefono', 'direccion', 'id_organizacion', 'id_mesa']
        for col in required_columns:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Falta la columna requerida: {col}")
        
        # Asegurar que las columnas opcionales existan, si no, crearlas con valores por defecto
        if 'id_rol' not in df.columns:
            df['id_rol'] = 6  # Por defecto Delegado
        if 'id_recinto' not in df.columns:
            df['id_recinto'] = None
        if 'id_distrito' not in df.columns:
            df['id_distrito'] = None
        
        # Validar que no haya valores nulos en columnas requeridas
        for idx, row in df.iterrows():
            for col in required_columns:
                if pd.isna(row[col]) or (isinstance(row[col], float) and pd.isna(row[col])):
                    raise HTTPException(status_code=400, detail=f"La fila {idx+2} tiene un valor nulo en la columna '{col}'")
        
        # Contar registros procesados
        total_registros = len(df)
        registros_insertados = 0
        errores = []
        
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor(dictionary=True)
            
            for idx, row in df.iterrows():
                try:
                    # Validar que el CI no esté registrado
                    cursor.execute("SELECT id_delegado FROM delegados WHERE ci = %s", (str(row['ci']),))
                    if cursor.fetchone():
                        errores.append(f"Fila {idx+2}: CI {row['ci']} ya está registrado")
                        continue
                    
                    # Convertir valores a tipos apropiados
                    id_organizacion = int(float(row['id_organizacion'])) if pd.notna(row['id_organizacion']) and row['id_organizacion'] != '' else None
                    id_mesa = int(float(row['id_mesa'])) if pd.notna(row['id_mesa']) and row['id_mesa'] != '' else None
                    id_rol = int(float(row['id_rol'])) if pd.notna(row['id_rol']) and row['id_rol'] != '' else 6
                    id_recinto = int(float(row['id_recinto'])) if pd.notna(row['id_recinto']) and row['id_recinto'] != '' else None
                    id_distrito = int(float(row['id_distrito'])) if pd.notna(row['id_distrito']) and row['id_distrito'] != '' else None
                    
                    # Insertar delegado
                    cursor.execute("""
                        INSERT INTO delegados
                        (nombre, apellido, ci, telefono, direccion, id_organizacion, id_mesa, id_rol, id_recinto, id_distrito)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        str(row['nombre']),
                        str(row['apellido']),
                        str(row['ci']),
                        str(row['telefono']) if pd.notna(row['telefono']) else '',
                        str(row['direccion']) if pd.notna(row['direccion']) else '',
                        id_organizacion,
                        id_mesa,
                        id_rol,
                        id_recinto,
                        id_distrito
                    ))
                    delegado_id = cursor.lastrowid
                    
                    # Crear usuario automáticamente con el rol correspondiente
                    nombre_inicial = str(row['nombre'])[0].lower() if str(row['nombre']) else ''
                    username = f"{row['ci']}{nombre_inicial}"
                    password = f"{row['ci']}{nombre_inicial}"  # Contraseña por defecto
                    
                    # Hashear contraseña
                    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    
                    # Verificar si el usuario ya existe
                    cursor.execute("SELECT id_usuario FROM usuarios WHERE username = %s", (username,))
                    usuario_existente = cursor.fetchone()
                    
                    if usuario_existente:
                        # Actualizar rol del usuario existente
                        cursor.execute("""
                            UPDATE usuarios SET id_rol = %s WHERE username = %s
                        """, (id_rol, username))
                    else:
                        # Crear nuevo usuario
                        fullname = f"{row['nombre']} {row['apellido']}"
                        cursor.execute("""
                            INSERT INTO usuarios (username, fullname, password_hash, id_rol)
                            VALUES (%s, %s, %s, %s)
                        """, (username, fullname, password_hash, id_rol))
                    
                    registros_insertados += 1
                    
                except Exception as e:
                    errores.append(f"Fila {idx+2}: Error al procesar - {str(e)}")
                    continue
            
            conn.commit()
        
        return {
            "message": f"Carga masiva completada. {registros_insertados} de {total_registros} registros insertados exitosamente.",
            "total_registros": total_registros,
            "registros_insertados": registros_insertados,
            "registros_fallidos": total_registros - registros_insertados,
            "errores": errores
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")
