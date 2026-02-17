# verificar_conexion_db.py
import mysql.connector
from mysql.connector import Error

def verificar_conexion():
    config = {
        'host': 'import-as.com',
        'port': 3306,
        'user': 'sub2026',
        'password': 'pU^H0N~h6rq4qbji',
        'database': 'elec2026'
    }

    print("🔍 Iniciando verificación de conexión a la base de datos...\n")

    # Paso 1: Conexión básica
    try:
        connection = mysql.connector.connect(**config)
        print("✅ Conexión exitosa al servidor MySQL")
    except Error as e:
        print(f"❌ ERROR DE CONEXIÓN: {e}")
        print("   - Verifica que el servidor 'import-as.com' permita conexiones externas")
        print("   - Asegúrate de que el puerto 3306 no esté bloqueado por firewall")
        return False

    # Paso 2: Verificar base de datos
    try:
        cursor = connection.cursor()
        cursor.execute("USE elec2026")
        print("✅ Base de datos 'elec2026' accesible")
    except Error as e:
        print(f"❌ ERROR DE BASE DE DATOS: {e}")
        print("   - La base de datos 'elec2026' no existe o el usuario no tiene permisos")
        connection.close()
        return False

    # Paso 3: Verificar tablas críticas
    tablas_esperadas = ['candidatos', 'mesas', 'organizaciones_politicas', 'actas']
    tablas_faltantes = []
    
    for tabla in tablas_esperadas:
        try:
            cursor.execute(f"SELECT 1 FROM {tabla} LIMIT 1")
            cursor.fetchone()
            print(f"✅ Tabla '{tabla}' verificada")
        except Error as e:
            print(f"⚠️  Tabla '{tabla}' no accesible: {e}")
            tablas_faltantes.append(tabla)

    if tablas_faltantes:
        print(f"\n❌ TABLAS FALTANTES: {', '.join(tablas_faltantes)}")
        print("   - Ejecuta los scripts SQL de inicialización")
        connection.close()
        return False

    # Paso 4: Prueba de escritura (opcional pero recomendado)
    try:
        cursor.execute("CREATE TEMPORARY TABLE test_conn (id INT)")
        cursor.execute("INSERT INTO test_conn VALUES (1)")
        cursor.execute("SELECT COUNT(*) FROM test_conn")
        count = cursor.fetchone()[0]
        cursor.execute("DROP TEMPORARY TABLE test_conn")
        
        if count == 1:
            print("✅ Permisos de escritura verificados")
        else:
            print("⚠️  Permisos de escritura limitados (solo lectura)")
    except Error as e:
        print(f"⚠️  Permisos de escritura no disponibles: {e}")

    # Cierre limpio
    cursor.close()
    connection.close()
    print("\n🎉 ¡Verificación completada con éxito!")
    print("   Tu aplicación puede conectarse a la base de datos.")
    return True

if __name__ == "__main__":
    verificar_conexion()