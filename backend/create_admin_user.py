"""
Script para crear usuario administrador en la base de datos
Ejecutar en PythonAnywhere o localmente
"""
import mysql.connector
import bcrypt
import os

# ============================================
# CONFIGURACIÓN DE BASE DE DATOS
# ============================================
# Para PythonAnywhere
DB_CONFIG = {
    'host': 'giovann.mysql.pythonanywhere-services.com',
    'user': 'giovann',
    'password': 'libre2026!!',
    'database': 'giovann$elec2026',
    'port': 3306,
}

# Para local (descomentar si usás local)
# DB_CONFIG = {
#     'host': 'localhost',
#     'user': 'root',
#     'password': '',
#     'database': 'elec2026',
#     'port': 3306,
# }

def crear_admin():
    """Crea usuario administrador por defecto"""
    
    print("="*60)
    print("🔐 CREAR USUARIO ADMINISTRADOR")
    print("="*60)
    
    # Datos del admin
    username = input("\n📝 Username (por defecto: admin): ").strip() or "admin"
    password = input("🔑 Contraseña (por defecto: admin123): ").strip() or "admin123"
    fullname = input("👤 Nombre completo (por defecto: Administrador): ").strip() or "Administrador"
    
    # Generar hash de la contraseña
    print("\n🔐 Generando hash de contraseña...")
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    print(f"   Hash generado: {hashed_password[:50]}...")
    
    try:
        # Conectar a la base de datos
        print("\n📡 Conectando a la base de datos...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ Conexión exitosa")
        
        # Verificar si el usuario ya existe
        print(f"\n🔍 Verificando si el usuario '{username}' ya existe...")
        cursor.execute("SELECT id_usuario, username FROM usuarios WHERE username = %s", (username,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"⚠️  El usuario '{username}' YA EXISTE (ID: {existing_user[0]})")
            response = input("   ¿Querés actualizar la contraseña? (yes/no): ").strip().lower()
            if response == 'yes':
                cursor.execute(
                    "UPDATE usuarios SET password_hash = %s, fullname = %s WHERE username = %s",
                    (hashed_password, fullname, username)
                )
                conn.commit()
                print(f"✅ ¡Contraseña de '{username}' actualizada exitosamente!")
            else:
                print("❌ Operación cancelada")
        else:
            # Crear nuevo usuario (rol 1 = ADMIN)
            print(f"\n📝 Creando usuario '{username}' con rol de administrador...")
            cursor.execute("""
                INSERT INTO usuarios (username, password_hash, fullname, id_rol)
                VALUES (%s, %s, %s, 1)
            """, (username, hashed_password, fullname))
            conn.commit()
            print(f"✅ ¡Usuario '{username}' creado exitosamente!")
        
        # Verificar creación
        print("\n📋 Verificando usuario creado...")
        cursor.execute("""
            SELECT u.id_usuario, u.username, u.fullname, r.nombre_rol
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.username = %s
        """, (username,))
        user = cursor.fetchone()
        
        if user:
            print("\n" + "="*60)
            print("✅ USUARIO CREADO/ACTUALIZADO EXITOSAMENTE")
            print("="*60)
            print(f"   ID: {user[0]}")
            print(f"   Username: {user[1]}")
            print(f"   Nombre: {user[2]}")
            print(f"   Rol: {user[3]}")
            print("="*60)
            print(f"\n🔐 Ahora podés loguearte con:")
            print(f"   Username: {username}")
            print(f"   Contraseña: {password}")
            print("="*60)
        
        # Cerrar conexión
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"\n❌ ERROR DE BASE DE DATOS: {e}")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")

if __name__ == "__main__":
    print("\n⚠️  Este script creará un usuario administrador en la base de datos")
    print("   Asegurate de tener permisos de escritura\n")
    
    crear_admin()
    
    print("\n✅ ¡Proceso completado!")
