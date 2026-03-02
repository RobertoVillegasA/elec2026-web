# Configuración de Microsoft OneDrive para el Sistema Electoral
# 
# PASOS PARA CONFIGURAR:
# 1. Ve a https://portal.azure.com/
# 2. Inicia sesión con tu cuenta personal de Microsoft (Outlook/Hotmail)
# 3. Ve a "Azure Active Directory" > "Registros de aplicaciones"
# 4. Haz clic en "Nuevo registro"
# 5. Nombre: "elec2026-onedrive"
# 6. Tipos de cuenta compatibles: "Cuentas en cualquier directorio organizativo y cuentas Microsoft personales"
# 7. URI de redireccionamiento: Deja vacío (usaremos flujo de dispositivo)
# 8. Haz clic en "Registrar"
# 9. Copia el "Id. de aplicación (cliente)" y pégalo en ONEDRIVE_CLIENT_ID
# 10. Ve a "Certificados y secretos" > "Nuevo secreto de cliente"
# 11. Copia el valor del secreto y pégalo en ONEDRIVE_CLIENT_SECRET
# 12. Ve a "API permissions" > "Agregar permiso" > "Microsoft Graph" > "Delegated"
# 13. Agrega: Files.ReadWrite, Files.ReadWrite.All, offline_access
# 14. Haz clic en "Conceder consentimiento de administrador"

# ID de la aplicación (cliente) de Azure AD
ONEDRIVE_CLIENT_ID = "TU_CLIENT_ID_AQUI"

# Secreto de cliente de Azure AD
ONEDRIVE_CLIENT_SECRET = "TU_CLIENT_SECRET_AQUI"

# ID del tenant (puedes usar "common" para cuentas personales)
ONEDRIVE_TENANT_ID = "common"

# Nombre de la carpeta donde se guardarán las imágenes en OneDrive
ONEDRIVE_FOLDER_NAME = "elec2026-actas"

# Configuración de imágenes
IMAGE_MAX_SIZE = 400  # Tamaño máximo en píxeles (imagen cuadrada)
IMAGE_QUALITY = 85    # Calidad de compresión JPEG (1-100)
IMAGE_FORMAT = "JPEG" # Formato de salida

# Ruta para guardar el token de acceso (se genera automáticamente)
ONEDRIVE_TOKEN_FILE = "onedrive_token.json"
