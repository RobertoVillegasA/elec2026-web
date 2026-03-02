#!/usr/bin/env python3
"""
Script para verificar la conexion con la carpeta de Google Drive configurada
"""

import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from google_drive_personal_config import GOOGLE_DRIVE_FOLDER_ID

print("=" * 70)
print("VERIFICACION DE CARPETA GOOGLE DRIVE")
print("=" * 70)
print(f"\nCarpeta configurada: {GOOGLE_DRIVE_FOLDER_ID}")
print(f"URL: https://drive.google.com/drive/folders/{GOOGLE_DRIVE_FOLDER_ID}")
print("\n" + "=" * 70)

try:
    from google_drive_personal_service import drive_personal_service
    
    if drive_personal_service.service:
        print("\nOK: Servicio de Google Drive inicializado correctamente")
        
        if drive_personal_service.folder_id:
            print(f"\nOK: Carpeta verificada exitosamente")
            print(f"   ID: {drive_personal_service.folder_id}")
            
            print("\nArchivos en la carpeta:")
            try:
                results = drive_personal_service.service.files().list(
                    q=f"'{drive_personal_service.folder_id}' in parents and trashed=false",
                    spaces='drive',
                    fields='files(id, name, mimeType, size, createdTime)',
                    pageSize=10
                ).execute()
                
                files = results.get('files', [])
                
                if files:
                    for file in files:
                        file_type = "[CARPETA]" if file.get('mimeType') == 'application/vnd.google-apps.folder' else "[ARCHIVO]"
                        size = f"({file.get('size', 'N/A')} bytes)" if file.get('size') else ""
                        print(f"   {file_type} {file['name']} {size}")
                else:
                    print("   (carpeta vacia)")
                    
            except Exception as e:
                print(f"   WARNING: No se pudo listar el contenido: {e}")
        else:
            print("\nERROR: No se pudo verificar la carpeta")
            print("\nPosibles causas:")
            print("   1. La carpeta no existe")
            print("   2. No tienes permisos sobre la carpeta")
            print("   3. El ID de carpeta es incorrecto")
    else:
        print("\nERROR: Servicio de Google Drive no disponible")
        print("\nVerifica:")
        print("   1. Que google_oauth_credentials.json exista en backend/")
        print("   2. Que hayas completado la autenticacion OAuth")
        
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("Prueba completada")
print("=" * 70)
