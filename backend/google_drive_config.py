# Configuración de Google Drive con OAuth (cuenta personal)
# 
# Carpeta: fotos_elec26
# URL: https://drive.google.com/drive/folders/1jiq-KZBlIc8SyyMKh8KC1QPQ6wLrFqCT

# ID de la carpeta de Google Drive donde se guardarán las imágenes
GOOGLE_DRIVE_FOLDER_ID = "1jiq-KZBlIc8SyyMKh8KC1QPQ6wLrFqCT"

# Ruta al archivo de credenciales OAuth (NO service account)
GOOGLE_CREDENTIALS_FILE = "google_oauth_credentials.json"

# Nombre de la carpeta donde se guardarán las imágenes en Drive
DRIVE_FOLDER_NAME = "fotos_elec26"

# Configuración de imágenes
IMAGE_MAX_SIZE = 400  # Tamaño máximo en píxeles (imagen cuadrada)
IMAGE_QUALITY = 85    # Calidad de compresión JPEG (1-100)
IMAGE_FORMAT = "JPEG" # Formato de salida

# Ruta para guardar el token de acceso (se genera automáticamente)
GOOGLE_TOKEN_FILE = "google_token.json"

# Scopes necesarios para acceder a Drive
GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/drive.file'
]
