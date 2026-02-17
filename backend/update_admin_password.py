# update_admin_password.py
import bcrypt
import mysql.connector

DB_CONFIG = {
    'host': 'import-as.com',
    'user': 'sub2026',
    'password': 'pU^H0N~h6rq4qbji',
    'database': 'elec2026',
}

# Hashea "123456"
new_hash = bcrypt.hashpw("123456".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print("Nuevo hash para '123456':", new_hash)

# Actualiza en BD
conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()
cursor.execute("UPDATE usuarios SET password_hash = %s WHERE username = 'admin'", (new_hash,))
conn.commit()
print("✅ Contraseña de 'admin' actualizada correctamente")
conn.close()