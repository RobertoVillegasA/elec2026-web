# backend/db.py
import mysql.connector
import bcrypt
import threading
import time
from mysql.connector.pooling import MySQLConnectionPool
from mysql_config import MYSQL_CONFIG, RETRY_CONFIG

# === POOL DE CONEXIONES ===
_connection_pool = None
_pool_lock = threading.Lock()

def get_connection_pool():
    global _connection_pool
    if _connection_pool is None:
        with _pool_lock:
            if _connection_pool is None:
                try:
                    _connection_pool = MySQLConnectionPool(
                        pool_name="electoral_pool",
                        pool_size=MYSQL_CONFIG['pool_size'],
                        pool_reset_session=MYSQL_CONFIG['pool_reset_session'],
                        **{k: v for k, v in MYSQL_CONFIG.items() 
                           if k not in ['pool_size', 'pool_reset_session']}
                    )
                    print("✅ Pool de conexiones creado exitosamente")
                except Exception as e:
                    print(f"❌ Error creando pool de conexiones: {e}")
                    return None
    return _connection_pool

def get_db_connection():
    """Obtiene una conexión del pool con reintentos automáticos"""
    max_retries = RETRY_CONFIG['max_retries']
    retry_delay = RETRY_CONFIG['retry_delay']
    
    for attempt in range(max_retries):
        try:
            pool = get_connection_pool()
            if pool:
                conn = pool.get_connection()
                if conn and conn.is_connected():
                    # Verificar que la conexión está viva
                    try:
                        cursor = conn.cursor()
                        cursor.execute("SELECT 1")
                        cursor.fetchone()
                        cursor.close()
                        return conn
                    except Exception as e:
                        print(f"⚠️ Conexión no respondió: {e}")
                        try:
                            conn.close()
                        except:
                            pass
                        raise
        except Exception as e:
            attempt_num = attempt + 1
            print(f"⚠️ Intento {attempt_num}/{max_retries} - Error obteniendo conexión: {e}")
            if attempt_num < max_retries:
                print(f"   Reintentando en {retry_delay} segundo(s)...")
                time.sleep(retry_delay)
            else:
                print(f"❌ No se pudo establecer conexión después de {max_retries} intentos")
                raise
    
    return None

def close_connection(conn):
    if conn:
        try:
            conn.close()
        except Exception as e:
            print(f"⚠️ Error cerrando conexión: {e}")

# === MANEJADOR DE CONEXIÓN SEGURO (context manager) ===
class DatabaseConnection:
    def __enter__(self):
        self.conn = get_db_connection()
        if not self.conn:
            raise Exception("No se pudo establecer conexión con la base de datos")
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            try:
                if exc_type is not None:
                    print(f"⚠️ Rollback por excepción: {exc_type.__name__}: {exc_val}")
                    self.conn.rollback()
                else:
                    self.conn.commit()
            except Exception as e:
                print(f"❌ Error en commit/rollback: {e}")
                try:
                    self.conn.rollback()
                except:
                    pass
            finally:
                close_connection(self.conn)

# === FUNCIONES DE SEGURIDAD ===
def hash_password(password):
    """Genera un hash bcrypt de la contraseña"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password, hashed_password):
    """Verifica una contraseña contra su hash bcrypt"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"⚠️ Error en verify_password: {e}")
        return False

def verificar_usuario(username, password):
    """Verifica credenciales con bcrypt"""
    print(f"🔍 LOGIN INTENT: username='{username}', password='{password}'")  # ← AÑADE ESTO
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT u.id_usuario, u.username, u.fullname, u.password_hash, r.nombre_rol
                FROM usuarios u
                JOIN roles r ON u.id_rol = r.id_rol
                WHERE u.username = %s
            """, (username,))
            user = cursor.fetchone()
            if user:
                print(f"🔑 FOUND USER: {user['username']}, hash={user['password_hash']}")
                if verify_password(password, user["password_hash"]):
                    print("✅ ¡CONTRASEÑA CORRECTA!")
                    return user
                else:
                    print("❌ CONTRASEÑA INCORRECTA (bcrypt falló)")
            else:
                print("❌ USUARIO NO ENCONTRADO")
    return None

# === CATÁLOGOS Y JERARQUÍA ===
def get_catalog(table_name):
    """Obtiene catálogo con manejo de conexiones"""
    data = {}
    config = {
        "organizaciones_politicas": ("id_organizacion", "nombre"),
        "cargos": ("id_cargo", "nombre_cargo"),
        "roles": ("id_rol", "nombre_rol"),
        "departamentos": ("id_departamento", "nombre")
    }
    
    if table_name not in config:
        print(f"❌ Tabla '{table_name}' no permitida")
        return data
        
    id_col, name_col = config[table_name]
    query = f"SELECT {id_col}, {name_col} FROM {table_name} ORDER BY {name_col} ASC"
    
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query)
            for row in cursor.fetchall():
                data[str(row[name_col])] = row[id_col]
    return data

def get_provincias_by_depto(id_depto):
    data = {}
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id_provincia, nombre FROM provincias WHERE id_departamento = %s ORDER BY nombre", (id_depto,))
            for row in cursor.fetchall():
                data[str(row['nombre'])] = row['id_provincia']
    return data

def get_municipios_by_provincia(id_prov):
    data = {}
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id_municipio, nombre FROM municipios WHERE id_provincia = %s ORDER BY nombre", (id_prov,))
            for row in cursor.fetchall():
                data[str(row['nombre'])] = row['id_municipio']
    return data

def get_recintos_by_municipio(id_muni):
    data = {}
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id_recinto, nombre FROM recintos WHERE id_municipio = %s ORDER BY nombre", (id_muni,))
            for row in cursor.fetchall():
                data[str(row['nombre'])] = row['id_recinto']
    return data

def get_mesas_by_recinto(id_recinto):
    data = {}
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id_mesa, numero_mesa FROM mesas WHERE id_recinto = %s ORDER BY numero_mesa", (id_recinto,))
            for row in cursor.fetchall():
                data[str(row['numero_mesa'])] = row['id_mesa']
    return data

# === CANDIDATOS ===
def get_candidates_list():
    data = []
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT c.*, o.sigla as organizacion_nombre, cg.nombre_cargo as cargo_nombre,
                       d.nombre as departamento_nombre, m.nombre as municipio_nombre
                FROM candidatos c
                LEFT JOIN organizaciones_politicas o ON c.id_organizacion = o.id_organizacion
                LEFT JOIN cargos cg ON c.id_cargo = cg.id_cargo
                LEFT JOIN departamentos d ON c.id_departamento = d.id_departamento
                LEFT JOIN municipios m ON c.id_municipio = m.id_municipio
                ORDER BY c.id_candidato DESC
            """)
            data = cursor.fetchall()
    return data

def get_candidate_by_id(candidate_id):
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT c.*, o.sigla as organizacion_nombre, cg.nombre_cargo as cargo_nombre,
                       d.nombre as departamento_nombre, m.nombre as municipio_nombre
                FROM candidatos c
                LEFT JOIN organizaciones_politicas o ON c.id_organizacion = o.id_organizacion
                LEFT JOIN cargos cg ON c.id_cargo = cg.id_cargo
                LEFT JOIN departamentos d ON c.id_departamento = d.id_departamento
                LEFT JOIN municipios m ON c.id_municipio = m.id_municipio
                WHERE c.id_candidato = %s
            """, (candidate_id,))
            return cursor.fetchone()
    return None

def save_candidate_full(candidate_data):
    with DatabaseConnection() as conn:
        if not conn:
            return False
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO candidatos (
                    id_organizacion, id_cargo, id_departamento, id_municipio,
                    nombres, apellidos, genero, edad, tipo_candidatura
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                candidate_data['id_organizacion'],
                candidate_data['id_cargo'],
                candidate_data.get('id_departamento') or None,
                candidate_data.get('id_municipio') or None,
                candidate_data['nombres'],
                candidate_data['apellidos'],
                candidate_data.get('genero'),
                candidate_data.get('edad'),
                candidate_data.get('tipo_candidatura', 'TITULAR')
            ))
            return True
        except Exception as e:
            print(f"❌ Error al guardar candidato: {e}")
            raise
    return False

def update_candidate(candidate_id, data):
    with DatabaseConnection() as conn:
        if not conn:
            return False
        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE candidatos SET
                    nombres = %s, apellidos = %s, genero = %s, edad = %s,
                    tipo_candidatura = %s, id_organizacion = %s, id_cargo = %s,
                    id_departamento = %s, id_municipio = %s
                WHERE id_candidato = %s
            """, (
                data['nombres'], data['apellidos'], data['genero'], data['edad'],
                data['tipo_candidatura'], data['id_organizacion'], data['id_cargo'],
                data.get('id_departamento'), data.get('id_municipio'), candidate_id
            ))
            return True
        except Exception as e:
            print(f"❌ Error actualizando candidato: {e}")
            raise
    return False

def delete_candidate(candidate_id):
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM candidatos WHERE id_candidato = %s", (candidate_id,))
            return True
    return False

# === DELEGADOS ===
def get_delegados_list():
    delegados = []
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT d.*, o.sigla as organizacion, r.nombre as recinto, m.numero_mesa as mesa
                FROM delegados d
                LEFT JOIN organizaciones_politicas o ON d.id_organizacion = o.id_organizacion
                LEFT JOIN mesas m ON d.id_mesa = m.id_mesa
                LEFT JOIN recintos r ON m.id_recinto = r.id_recinto
                ORDER BY d.id_delegado DESC
            """)
            delegados = cursor.fetchall()
    return delegados

def save_delegado(data):
    with DatabaseConnection() as conn:
        if not conn:
            return False
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO delegados (
                    nombre, apellido, ci, telefono, direccion, id_organizacion, id_mesa
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                data['nombre'],
                data['apellido'],
                data['ci'],
                data.get('telefono', ''),
                data.get('direccion', ''),
                data['id_organizacion'],
                data['id_mesa']
            ))
            return True
        except Exception as e:
            print(f"❌ Error guardando delegado: {e}")
            raise
    return False

def delete_delegado(id_delegado):
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM delegados WHERE id_delegado = %s", (id_delegado,))
            return True
    return False

# === DASHBOARD ===
# === DASHBOARD Y RESULTADOS ===
# En db.py, dentro de get_resumen_dashboard()
def get_resumen_dashboard():
    """Obtiene un resumen general del sistema electoral para GOBERNADOR (SUBNACIONAL), incluyendo votos de LIBRE."""
    res = {
        "total_actas": 0,
        "total_votos": 0,
        "total_candidatos": 0,
        "votos_blancos": 0,
        "votos_nulos": 0,
        "votos_libre_gob": 0  # ← GOBERNADOR
    }
    with DatabaseConnection() as conn:
        if not conn:
            return res
        try:
            cursor = conn.cursor()

            # Total actas - SOLO SUBNACIONAL (Gobernador)
            cursor.execute("SELECT COUNT(*) FROM actas WHERE tipo_papeleta = 'SUBNACIONAL'")
            res["total_actas"] = int(cursor.fetchone()[0])

            # Total candidatos
            cursor.execute("SELECT COUNT(*) FROM candidatos")
            res["total_candidatos"] = int(cursor.fetchone()[0])

            # Votos blancos y nulos - SOLO SUBNACIONAL (Gobernador)
            cursor.execute("SELECT IFNULL(SUM(votos_blancos), 0) FROM actas WHERE tipo_papeleta = 'SUBNACIONAL'")
            res["votos_blancos"] = int(cursor.fetchone()[0])
            cursor.execute("SELECT IFNULL(SUM(votos_nulos), 0) FROM actas WHERE tipo_papeleta = 'SUBNACIONAL'")
            res["votos_nulos"] = int(cursor.fetchone()[0])

            # Total votos generales - SOLO SUBNACIONAL (Gobernador)
            # Calcular total de votos como la suma de votos_blancos_gob + votos_nulos_gob + votos_detalle
            cursor.execute("""
                SELECT COALESCE(SUM(votos_blancos_gob + votos_nulos_gob), 0)
                FROM actas
                WHERE tipo_papeleta = 'SUBNACIONAL'
            """)
            total_base = cursor.fetchone()[0] or 0
            
            # Sumar votos_detalle
            cursor.execute("""
                SELECT COALESCE(SUM(vd.votos_cantidad), 0)
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                WHERE a.tipo_papeleta = 'SUBNACIONAL'
            """)
            total_votos_detalle = cursor.fetchone()[0] or 0
            
            res["total_votos"] = int(total_base) + int(total_votos_detalle)

            # Votos específicos para LIBRE - SOLO SUBNACIONAL (Gobernador)
            cursor.execute("""
                SELECT COALESCE(SUM(vd.votos_cantidad), 0)
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                WHERE op.sigla = 'LIBRE_GOB' AND a.tipo_papeleta = 'SUBNACIONAL'
            """)
            res["votos_libre_gob"] = int(cursor.fetchone()[0])

        except Exception as e:
            print(f"❌ Error en get_resumen_dashboard: {e}")
    return res


def get_resultados_globales():
    """Obtiene el total de votos por organización política a nivel nacional."""
    resultados = []
    with DatabaseConnection() as conn:
        if not conn:
            return resultados
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT o.sigla AS nombre, 
                       CAST(IFNULL(SUM(vd.votos_cantidad), 0) AS UNSIGNED) AS votos
                FROM organizaciones_politicas o
                LEFT JOIN votos_detalle vd ON o.id_organizacion = vd.id_organizacion
                GROUP BY o.id_organizacion
                ORDER BY votos DESC
            """)
            resultados = cursor.fetchall()
        except Exception as e:
            print(f"❌ Error en get_resultados_globales: {e}")
    return resultados


def get_resultados_departamental():
    """Obtiene el total de votos por departamento."""
    resultados = []
    with DatabaseConnection() as conn:
        if not conn:
            return resultados
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT d.nombre AS nombre,
                       COALESCE(SUM(vd.votos_cantidad), 0) AS votos
                FROM departamentos d
                LEFT JOIN provincias p ON d.id_departamento = p.id_departamento
                LEFT JOIN municipios m ON p.id_provincia = m.id_provincia
                LEFT JOIN recintos r ON m.id_municipio = r.id_municipio
                LEFT JOIN mesas me ON r.id_recinto = me.id_recinto
                LEFT JOIN actas a ON me.id_mesa = a.id_mesa
                LEFT JOIN votos_detalle vd ON a.id_acta = vd.id_acta
                GROUP BY d.id_departamento
                ORDER BY votos DESC
            """)
            resultados = cursor.fetchall()
        except Exception as e:
            print(f"❌ Error en get_resultados_departamental: {e}")
    return resultados


def get_resultados_municipal():
    """Obtiene el total de votos por municipio."""
    resultados = []
    with DatabaseConnection() as conn:
        if not conn:
            return resultados
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT m.nombre AS nombre,
                       COALESCE(SUM(vd.votos_cantidad), 0) AS votos
                FROM municipios m
                LEFT JOIN recintos r ON m.id_municipio = r.id_municipio
                LEFT JOIN mesas me ON r.id_recinto = me.id_recinto
                LEFT JOIN actas a ON me.id_mesa = a.id_mesa
                LEFT JOIN votos_detalle vd ON a.id_acta = vd.id_acta
                GROUP BY m.id_municipio
                ORDER BY votos DESC
            """)
            resultados = cursor.fetchall()
        except Exception as e:
            print(f"❌ Error en get_resultados_municipal: {e}")
    return resultados


def get_actas_subnacionales():
    """Obtiene lista de actas subnacionales con geografía y resumen de votos."""
    actas = []
    with DatabaseConnection() as conn:
        if not conn:
            return actas
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT
                    a.id_acta,
                    a.votos_blancos,
                    a.votos_nulos,
                    a.fecha_registro,
                    a.observaciones,
                    m.id_mesa,
                    m.numero_mesa,
                    r.nombre AS recinto,
                    mu.nombre AS municipio,
                    p.nombre AS provincia,
                    d.nombre AS departamento,
                    (a.votos_blancos + a.votos_nulos + IFNULL(SUM(vd.votos_cantidad), 0)) AS total_votos
                FROM actas a
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                LEFT JOIN votos_detalle vd ON a.id_acta = vd.id_acta
                WHERE a.tipo_papeleta = 'SUBNACIONAL'
                GROUP BY a.id_acta
                ORDER BY a.fecha_registro DESC
            """)
            actas = cursor.fetchall()
        except Exception as e:
            print(f"❌ Error en get_actas_subnacionales: {e}")
    return actas

def get_all_actas():
    """Obtiene todas las actas con geografía y resumen de votos."""
    actas = []
    with DatabaseConnection() as conn:
        if not conn:
            return actas
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT
                    a.id_acta,
                    a.codigo_acta,
                    a.votos_blancos,
                    a.votos_nulos,
                    a.fecha_registro,
                    a.observaciones,
                    a.tipo_papeleta,
                    m.id_mesa,
                    m.numero_mesa,
                    r.nombre AS nombre_recinto,
                    mu.nombre AS nombre_municipio,
                    p.nombre AS nombre_provincia,
                    d.nombre AS nombre_departamento
                FROM actas a
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
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

        except Exception as e:
            print(f"❌ Error en get_all_actas: {e}")
    return actas



def save_acta_subnacional(acta_info, votos_partidos):
    """Guarda un acta de escrutinio con sus votos por organización."""
    with DatabaseConnection() as conn:
        if not conn:
            return False
        try:
            cursor = conn.cursor()
            
            # 🔑 VALIDACIÓN: ¿Ya existe un acta para esta mesa?
            cursor.execute("SELECT id_acta FROM actas WHERE id_mesa = %s", (acta_info['id_mesa'],))
            if cursor.fetchone():
                raise Exception("Acta ya registrada para esta mesa")

            fecha_registro = acta_info.get('fecha_registro')
            if not fecha_registro:
                fecha_registro = datetime.utcnow().isoformat()

            cursor.execute("""
                INSERT INTO actas (
                    id_mesa,
                    tipo_papeleta,
                    codigo_acta,
                    votos_blancos_gob,
                    votos_nulos_gob,
                    observaciones,
                    usuario_registro,
                    fecha_registro
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                acta_info['id_mesa'],
                acta_info['tipo'],
                acta_data['codigo_acta'],  # ← Añadido
                acta_info['blancos'],
                acta_info['nulos'],
                acta_info.get('observaciones') or None,
                acta_info['user_id'],
                fecha_registro
            ))

            id_acta = cursor.lastrowid

            for id_org, cant in votos_partidos.items():
                if cant > 0:
                    cursor.execute("""
                        INSERT INTO votos_detalle (id_acta, id_organizacion, votos_cantidad)
                        VALUES (%s, %s, %s)
                    """, (id_acta, id_org, cant))

            return True
        except Exception as e:
            print(f"❌ Error al guardar acta: {e}")
            raise
    return False    


def insert_departamento(nombre):
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO departamentos (nombre) VALUES (%s)", (nombre,))
            return cursor.lastrowid
    return None

def insert_provincia(nombre, id_departamento):
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO provincias (nombre, id_departamento) VALUES (%s, %s)", (nombre, id_departamento))
            return cursor.lastrowid
    return None

def insert_municipio(nombre, id_provincia):
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO municipios (nombre, id_provincia) VALUES (%s, %s)", (nombre, id_provincia))
            return cursor.lastrowid
    return None

def insert_recinto(nombre, id_municipio):
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO recintos (nombre, id_municipio) VALUES (%s, %s)", (nombre, id_municipio))
            return cursor.lastrowid
    return None

def insert_mesa(numero_mesa, id_recinto):
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO mesas (numero_mesa, id_recinto) VALUES (%s, %s)", (numero_mesa, id_recinto))
            return cursor.lastrowid
    return None


def get_candidatos_por_planilla(id_organizacion: int, id_cargo: int, id_municipio: int = None, id_departamento: int = None):
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            query = """
                SELECT c.*, o.sigla as organizacion
                FROM candidatos c
                JOIN organizaciones_politicas o ON c.id_organizacion = o.id_organizacion
                WHERE c.id_organizacion = %s AND c.id_cargo = %s
            """
            params = [id_organizacion, id_cargo]
            if id_municipio:
                query += " AND c.id_municipio = %s"
                params.append(id_municipio)
            elif id_departamento:
                query += " AND c.id_departamento = %s"
                params.append(id_departamento)
            query += " AND c.tipo_candidatura = 'TITULAR' ORDER BY c.id_candidato"
            cursor.execute(query, params)
            return cursor.fetchall()
    return []



def get_votos_detalle_acta(id_acta):
    """Obtiene el desglose de votos por organización para una acta específica."""
    votos = []
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    o.sigla,
                    vd.votos_cantidad
                FROM votos_detalle vd
                JOIN organizaciones_politicas o ON vd.id_organizacion = o.id_organizacion
                WHERE vd.id_acta = %s
                ORDER BY vd.votos_cantidad DESC
            """, (id_acta,))
            votos = cursor.fetchall()
    return votos

def update_acta(id_acta, data):
    """Actualiza una acta existente (blancos, nulos, observaciones)."""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE actas
                SET votos_blancos_gob = %s, votos_nulos_gob = %s, observaciones = %s
                WHERE id_acta = %s
            """, (
                data.get('blancos', 0),
                data.get('nulos', 0),
                data.get('observaciones') or None,
                id_acta
            ))
            return cursor.rowcount > 0
    return False

def delete_acta_by_id(id_acta):
    """Elimina una acta y sus votos asociados."""
    with DatabaseConnection() as conn:
        if conn:
            cursor = conn.cursor()
            # Primero elimina los votos
            cursor.execute("DELETE FROM votos_detalle WHERE id_acta = %s", (id_acta,))
            # Luego la acta
            cursor.execute("DELETE FROM actas WHERE id_acta = %s", (id_acta,))
            return cursor.rowcount > 0
    return False