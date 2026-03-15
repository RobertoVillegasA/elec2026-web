from db import DatabaseConnection

conn = DatabaseConnection().__enter__()
cursor = conn.cursor(dictionary=True)

cursor.execute('SHOW TABLES LIKE "distritos"')
result = cursor.fetchone()
print(f'Distritos table exists: {result}')

cursor.execute('SELECT * FROM distritos LIMIT 3')
results = cursor.fetchall()
print(f'Distritos data: {results}')

cursor.execute('SELECT * FROM mesas LIMIT 5')
results = cursor.fetchall()
print(f'Mesas (first 5): {results}')

cursor.execute('SELECT * FROM recintos WHERE nombre = "UTA"')
results = cursor.fetchall()
print(f'Recinto UTA: {results}')

cursor.execute('SELECT * FROM municipios WHERE nombre = "Cochabamba"')
results = cursor.fetchall()
print(f'Municipio Cochabamba: {results}')
