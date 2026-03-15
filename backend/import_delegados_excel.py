"""
Script para importar delegados y coordinadores desde un archivo Excel.
- Lee los datos de delegados_vacio.xlsx
- Muestra los nombres de ubicaciones a IDs (recinto, mesa, rol, distrito, etc.)
- Inserta en la tabla delegados
- Crea usuario para cada uno con:
  - username: CI
  - password: CI + inicial del nombre
"""

import pandas as pd
import bcrypt
import sys
import os
import traceback

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import DatabaseConnection

def get_id_from_name(cursor, table, id_column, name_column, name_value, extra_conditions=None):
    """Obtiene el ID de un registro por su nombre."""
    if pd.isna(name_value) or name_value == '':
        return None
    
    query = f"SELECT {id_column} FROM {table} WHERE {name_column} = %s"
    params = [str(name_value)]
    
    if extra_conditions:
        query += extra_conditions['query']
        params.extend(extra_conditions['params'])
    
    cursor.execute(query, params)
    result = cursor.fetchone()
    # cursor con dictionary=True devuelve un dict, sino una tupla
    if result:
        if isinstance(result, dict):
            return result.get(id_column)
        return result[0] if result else None
    return None


def get_id_rol_by_nombre(cursor, nombre_rol):
    """Obtiene el ID de un rol por su nombre."""
    if pd.isna(nombre_rol) or nombre_rol == '':
        return None
    
    # Mapeo de nombres comunes de roles
    rol_mapping = {
        'admin': 1,
        'administrador': 1,
        'coordinador': 2,
        'digitador': 3,
        'coordinador_distrito': 4,
        'coordinador_distrital': 4,
        'coord_distrito': 4,
        'coordinador_recinto': 5,
        'coord_recinto': 5,
        'delegado': 6,
        'delegada': 6,
    }
    
    nombre_normalizado = str(nombre_rol).lower().strip().replace(' ', '_')
    
    # Intentar mapeo directo
    if nombre_normalizado in rol_mapping:
        return rol_mapping[nombre_normalizado]
    
    # Intentar búsqueda parcial
    for key, value in rol_mapping.items():
        if key in nombre_normalizado or nombre_normalizado in key:
            return value

    # Buscar en la base de datos
    cursor.execute("SELECT id_rol FROM roles WHERE LOWER(nombre_rol) LIKE %s", (f"%{nombre_normalized}%",))
    result = cursor.fetchone()
    return result.get('id_rol') if result else 6  # Default: Delegado


def importar_delegados(archivo_excel='delegados_vacio.xlsx'):
    """Importa delegados y coordinadores desde Excel."""
    
    # Verificar que el archivo existe
    if not os.path.exists(archivo_excel):
        print(f"❌ El archivo '{archivo_excel}' no existe")
        return
    
    # Leer el Excel
    print(f"📖 Leyendo archivo: {archivo_excel}")
    df = pd.read_excel(archivo_excel)
    
    # Verificar que hay datos
    if df.empty or df.shape[0] <= 0 or pd.isna(df.iloc[0]['nombre']):
        print("⚠️ El archivo Excel está vacío o no tiene datos válidos")
        print(f"   Columnas disponibles: {df.columns.tolist()}")
        return
    
    print(f"✅ {len(df)} registros encontrados en el Excel")
    print(f"   Columnas: {df.columns.tolist()}")
    
    # Estadísticas
    total_registros = len(df)
    registros_insertados = 0
    registros_omitidos = 0
    errores = []
    
    with DatabaseConnection() as conn:
        if not conn:
            print("❌ No se pudo conectar a la base de datos")
            return
        
        cursor = conn.cursor(dictionary=True)
        
        for idx, row in df.iterrows():
            try:
                # Validar datos requeridos
                nombre = str(row.get('nombre', '')).strip() if pd.notna(row.get('nombre')) else ''
                apellido = str(row.get('apellido', '')).strip() if pd.notna(row.get('apellido')) else ''
                ci = str(row.get('ci', '')).strip() if pd.notna(row.get('ci')) else ''
                
                if not nombre or not apellido or not ci:
                    errores.append(f"Fila {idx + 2}: Faltan datos requeridos (nombre, apellido o CI)")
                    registros_omitidos += 1
                    continue
                
                # Verificar CI duplicado
                cursor.execute("SELECT id_delegado FROM delegados WHERE ci = %s", (ci,))
                if cursor.fetchone():
                    errores.append(f"Fila {idx + 2}: CI '{ci}' ya está registrado")
                    registros_omitidos += 1
                    continue
                
                # Obtener IDs de ubicación
                telefono = str(row.get('telefono', '')).strip() if pd.notna(row.get('telefono')) else ''
                direccion = str(row.get('direccion', '')).strip() if pd.notna(row.get('direccion')) else ''
                
                # Obtener ID de organización (si existe)
                id_organizacion = None
                if 'id_organizacion' in row and pd.notna(row['id_organizacion']):
                    id_organizacion = int(row['id_organizacion'])
                elif 'organizacion' in row and pd.notna(row['organizacion']):
                    id_organizacion = get_id_from_name(
                        cursor, 'organizaciones_politicas', 'id_organizacion', 'sigla',
                        row['organizacion']
                    )
                
                # Obtener ID de recinto usando jerarquía geográfica
                id_recinto = None
                if 'id_recinto' in row and pd.notna(row['id_recinto']):
                    id_recinto = int(row['id_recinto'])
                elif 'recinto' in row and pd.notna(row['recinto']):
                    # Construir filtros basados en jerarquía geográfica
                    extra_filters = {'query': '', 'params': []}
                    
                    # Obtener ID de departamento si existe
                    id_depto = None
                    if 'id_departamento' in row and pd.notna(row['id_departamento']):
                        id_depto = int(row['id_departamento'])
                    elif 'departamento' in row and pd.notna(row['departamento']):
                        id_depto = get_id_from_name(
                            cursor, 'departamentos', 'id_departamento', 'nombre',
                            row['departamento']
                        )
                    
                    # Obtener ID de provincia si existe
                    id_prov = None
                    if id_depto:
                        if 'id_provincia' in row and pd.notna(row['id_provincia']):
                            id_prov = int(row['id_provincia'])
                        elif 'provincia' in row and pd.notna(row['provincia']):
                            id_prov = get_id_from_name(
                                cursor, 'provincias', 'id_provincia', 'nombre',
                                row['provincia'],
                                extra_conditions={'query': ' AND id_departamento = %s', 'params': [id_depto]}
                            )
                    
                    # Obtener ID de municipio si existe
                    id_muni = None
                    if id_prov:
                        if 'id_municipio' in row and pd.notna(row['id_municipio']):
                            id_muni = int(row['id_municipio'])
                        elif 'municipio' in row and pd.notna(row['municipio']):
                            id_muni = get_id_from_name(
                                cursor, 'municipios', 'id_municipio', 'nombre',
                                row['municipio'],
                                extra_conditions={'query': ' AND id_provincia = %s', 'params': [id_prov]}
                            )
                    
                    # Buscar recinto con filtros jerárquicos
                    if id_muni:
                        id_recinto = get_id_from_name(
                            cursor, 'recintos', 'id_recinto', 'nombre',
                            row['recinto'],
                            extra_conditions={'query': ' AND id_municipio = %s', 'params': [id_muni]}
                        )
                    elif id_prov:
                        # Buscar recinto por provincia
                        cursor.execute("""
                            SELECT r.id_recinto FROM recintos r
                            JOIN municipios m ON r.id_municipio = m.id_municipio
                            WHERE r.nombre = %s AND m.id_provincia = %s
                        """, (str(row['recinto']), id_prov))
                        result = cursor.fetchone()
                        id_recinto = result.get('id_recinto') if result else None
                    elif id_depto:
                        # Buscar recinto por departamento
                        cursor.execute("""
                            SELECT r.id_recinto FROM recintos r
                            JOIN municipios m ON r.id_municipio = m.id_municipio
                            JOIN provincias p ON m.id_provincia = p.id_provincia
                            WHERE r.nombre = %s AND p.id_departamento = %s
                        """, (str(row['recinto']), id_depto))
                        result = cursor.fetchone()
                        id_recinto = result.get('id_recinto') if result else None
                    else:
                        # Buscar recinto sin filtros
                        id_recinto = get_id_from_name(
                            cursor, 'recintos', 'id_recinto', 'nombre',
                            row['recinto']
                        )
                
                # Obtener ID de mesa
                id_mesa = None
                if 'id_mesa' in row and pd.notna(row['id_mesa']):
                    try:
                        id_mesa = int(float(row['id_mesa']))
                    except (ValueError, TypeError):
                        pass
                elif 'mesa' in row and pd.notna(row['mesa']):
                    try:
                        # Intentar como número primero
                        numero = int(float(row['mesa']))
                        cursor.execute(
                            "SELECT id_mesa FROM mesas WHERE numero_mesa = %s",
                            (numero,)
                        )
                        result = cursor.fetchone()
                        id_mesa = result.get('id_mesa') if result else None
                    except (ValueError, TypeError):
                        # Si no es número, intentar como string
                        id_mesa = get_id_from_name(
                            cursor, 'mesas', 'id_mesa', 'numero_mesa',
                            str(row['mesa'])
                        )
                
                # Obtener ID de distrito
                id_distrito = None
                if 'id_distrito' in row and pd.notna(row['id_distrito']):
                    try:
                        id_distrito = int(float(row['id_distrito']))
                    except (ValueError, TypeError):
                        pass
                elif 'distrito' in row and pd.notna(row['distrito']):
                    try:
                        # Intentar convertir a número primero (nro_distrito es numérico)
                        nro = int(float(row['distrito']))
                        cursor.execute(
                            "SELECT id_distrito FROM distritos WHERE nro_distrito = %s",
                            (nro,)
                        )
                        result = cursor.fetchone()
                        id_distrito = result.get('id_distrito') if result else None
                    except (ValueError, TypeError):
                        # Si no es número, intentar por nombre
                        id_distrito = get_id_from_name(
                            cursor, 'distritos', 'id_distrito', 'localidad',
                            row['distrito']
                        )
                
                # Obtener ID de rol
                id_rol = 6  # Default: Delegado
                if 'id_rol' in row and pd.notna(row['id_rol']):
                    id_rol = int(row['id_rol'])
                elif 'rol' in row and pd.notna(row['rol']):
                    id_rol = get_id_rol_by_nombre(cursor, row['rol'])
                
                # Insertar delegado
                cursor.execute("""
                    INSERT INTO delegados
                    (nombre, apellido, ci, telefono, direccion, id_organizacion, id_mesa, id_rol, id_recinto, id_distrito)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    nombre, apellido, ci, telefono, direccion,
                    id_organizacion, id_mesa, id_rol, id_recinto, id_distrito
                ))
                delegado_id = cursor.lastrowid
                
                # Crear usuario
                # username: CI
                # password: CI + inicial del nombre
                nombre_inicial = nombre[0].lower() if nombre else ''
                username = f"{ci}{nombre_inicial}"
                password = f"{ci}{nombre_inicial}"
                
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
                    print(f"  ⚠️ Usuario '{username}' ya existía, se actualizó el rol")
                else:
                    # Crear nuevo usuario
                    fullname = f"{nombre} {apellido}"
                    cursor.execute("""
                        INSERT INTO usuarios (username, fullname, password_hash, id_rol)
                        VALUES (%s, %s, %s, %s)
                    """, (username, fullname, password_hash, id_rol))
                
                conn.commit()
                registros_insertados += 1
                
                print(f"  ✅ {nombre} {apellido} (CI: {ci}) - Usuario: {username}")
                
            except Exception as e:
                error_msg = f"Fila {idx + 2}: {str(e)}"
                errores.append(error_msg)
                print(f"  ❌ Error en fila {idx + 2}: {str(e)}")
                print(f"     Detalle: {traceback.format_exc()}")
                continue
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE IMPORTACIÓN")
    print("=" * 60)
    print(f"   Total registros:        {total_registros}")
    print(f"   Insertados:             {registros_insertados}")
    print(f"   Omitidos/Error:         {registros_omitidos + len(errores)}")
    
    if errores:
        print(f"\n⚠️ ERRORES/OMISIONES:")
        for error in errores:
            print(f"   - {error}")
    
    if registros_insertados > 0:
        print(f"\n✅ ¡Importación completada exitosamente!")
        print(f"   Se crearon {registros_insertados} delegados/coordinadores con sus usuarios")


def generar_plantilla_excel(archivo_salida='delegados_plantilla.xlsx'):
    """Genera una plantilla Excel con listas desplegables basadas en la BD."""
    
    print("📝 Generando plantilla Excel con datos de la base de datos...")
    
    with DatabaseConnection() as conn:
        if not conn:
            print("❌ No se pudo conectar a la base de datos")
            return
        
        cursor = conn.cursor(dictionary=True)
        
        # Obtener roles
        cursor.execute("SELECT id_rol, nombre_rol FROM roles ORDER BY nombre_rol")
        roles = cursor.fetchall()
        
        # Obtener departamentos
        cursor.execute("SELECT id_departamento, nombre FROM departamentos ORDER BY nombre")
        departamentos = cursor.fetchall()
        
        # Obtener organizaciones
        cursor.execute("SELECT id_organizacion, sigla, nombre FROM organizaciones_politicas ORDER BY sigla")
        organizaciones = cursor.fetchall()
        
        cursor.close()
    
    # Crear DataFrame con columnas
    columnas = [
        'nombre', 'apellido', 'ci', 'telefono', 'direccion',
        'departamento', 'provincia', 'municipio', 'recinto', 'mesa',
        'rol', 'distrito', 'organizacion'
    ]
    
    df = pd.DataFrame(columns=columnas)
    
    # Guardar como Excel
    df.to_excel(archivo_salida, index=False)
    
    print(f"✅ Plantilla generada: {archivo_salida}")
    print("\n📋 Columnas disponibles:")
    for col in columnas:
        print(f"   - {col}")
    
    print("\n📝 Instrucciones:")
    print("   1. Abre el archivo Excel generado")
    print("   2. Completa los datos de delegados/coordinadores")
    print("   3. Usa los nombres exactos de la BD para ubicación")
    print("   4. Guarda y ejecuta: python import_delegados_excel.py [archivo]")
    
    return archivo_salida


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] in ['--generar', '-g', '--template', '-t']:
        archivo_salida = sys.argv[2] if len(sys.argv) > 2 else 'delegados_plantilla.xlsx'
        generar_plantilla_excel(archivo_salida)
    else:
        archivo = sys.argv[1] if len(sys.argv) > 1 else 'delegados_vacio.xlsx'
        importar_delegados(archivo)
