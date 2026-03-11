import pandas as pd

# Definir las columnas basadas en la estructura de la tabla delegados
columnas = [
    'id_delegado',
    'nombre',
    'apellido',
    'ci',
    'telefono',
    'direccion',
    'id_organizacion',
    'id_mesa',
    'id_rol',
    'id_recinto',
    'id_distrito'
]

# Crear un DataFrame vacío con las columnas definidas
df = pd.DataFrame(columns=columnas)

# Guardar el DataFrame como archivo Excel
df.to_excel('delegados_vacio.xlsx', index=False)

print("Archivo Excel 'delegados_vacio.xlsx' creado exitosamente con las columnas de la tabla delegados.")