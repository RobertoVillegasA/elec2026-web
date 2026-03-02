# Configuración de Google Drive con cuenta personal (OAuth 2.0)
# 
# PASOS PARA CONFIGURAR:
# 1. Ve a https://console.cloud.google.com/
# 2. Inicia sesión con tu cuenta personal de Google
# 3. Crea un nuevo proyecto o selecciona uno existente
# 4. Habilita Google Drive API
# 5. Crea credenciales OAuth 2.0
# 6. Descarga el archivo JSON y guárdalo como google_oauth_credentials.json

# ID del proyecto de Google Cloud
GOOGLE_PROJECT_ID = "TU_PROJECT_ID_AQUI"

# ID de la carpeta de Google Drive donde se guardarán las imágenes
# Carpeta configurada: elec2026-actas
GOOGLE_DRIVE_FOLDER_ID = "1yhn0-ictjw7z1i2oO3MhPcT3ZOH8kaa9"

# Ruta al archivo de credenciales OAuth (diferente al de service account)
GOOGLE_CREDENTIALS_FILE = "google_oauth_credentials.json"

# Nombre de la carpeta donde se guardarán las imágenes en Drive
DRIVE_FOLDER_NAME = "elec2026-actas"

# Configuración de imágenes
IMAGE_MAX_SIZE = 400  # Tamaño máximo en píxeles (imagen cuadrada)
IMAGE_QUALITY = 85    # Calidad de compresión JPEG (1-100)
IMAGE_FORMAT = "JPEG" # Formato de salida

# Ruta para guardar el token de acceso (se genera automáticamente)
GOOGLE_TOKEN_FILE = "google_token.json"

# Scopes necesarios para acceder a Drive
GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata'
]
