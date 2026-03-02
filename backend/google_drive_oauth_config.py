"""
Configuración alternativa de Google Drive usando OAuth (cuenta personal)
Útil cuando no tienes acceso a Shared Drives
"""

# ID de la carpeta de Google Drive donde se guardarán las imágenes
# (La carpeta debe estar en TU Drive personal)
GOOGLE_DRIVE_FOLDER_ID = "TU_FOLDER_ID_AQUI"

# Para OAuth personal, deja esto vacío o comenta la línea
# GOOGLE_SERVICE_ACCOUNT_EMAIL = ""

# Ruta al archivo de credenciales OAuth (diferente al de service account)
GOOGLE_CREDENTIALS_FILE = "google_oauth_credentials.json"

# Nombre de la carpeta donde se guardarán las imágenes en Drive
DRIVE_FOLDER_NAME = "elec2026-actas"

# Configuración de imágenes
IMAGE_MAX_SIZE = 400  # Tamaño máximo en píxeles (imagen cuadrada)
IMAGE_QUALITY = 85    # Calidad de compresión JPEG (1-100)
IMAGE_FORMAT = "JPEG" # Formato de salida
