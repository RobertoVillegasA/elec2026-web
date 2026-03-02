#!/usr/bin/env python3
"""
Script para verificar el acceso a la carpeta de Google Drive con OAuth
"""

import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from google_drive_config import GOOGLE_DRIVE_FOLDER_ID

print("=" * 70)
print("VERIFICACION DE ACCESO A GOOGLE DRIVE (OAuth)")
print("=" * 70)

print(f"\nCarpeta configurada: {GOOGLE_DRIVE_FOLDER_ID}")
print(f"URL: https://drive.google.com/drive/folders/{GOOGLE_DRIVE_FOLDER_ID}")

print("\n" + "=" * 70)

try:
    from google_drive_service import drive_service
    
    if drive_service.service:
        print("\nOK: Servicio de Google Drive inicializado correctamente")
        
        if drive_service.folder_id:
            print(f"\nOK: Acceso a carpeta verificado exitosamente")
            print(f"   ID: {drive_service.folder_id}")
            
            print("\nArchivos en la carpeta:")
            try:
                results = drive_service.service.files().list(
                    q=f"'{drive_service.folder_id}' in parents and trashed=false",
                    spaces='drive',
                    fields='files(id, name, mimeType, size, createdTime)',
                    pageSize=10
                ).execute()
                
                files = results.get('files', [])
                
                if files:
                    print(f"   Total archivos: {len(files)}")
                    for file in files:
                        file_type = "[CARPETA]" if file.get('mimeType') == 'application/vnd.google-apps.folder' else "[ARCHIVO]"
                        size = f"({file.get('size', 'N/A')} bytes)" if file.get('size') else ""
                        print(f"   {file_type} {file['name']} {size}")
                else:
                    print("   (carpeta vacia)")
                    
            except Exception as e:
                print(f"   WARNING: No se pudo listar el contenido: {e}")
            
            print("\n" + "=" * 70)
            print("PRUEBA DE SUBIDA DE IMAGEN")
            print("=" * 70)
            
            from PIL import Image
            import io
            
            print("\nCreando imagen de prueba...")
            img = Image.new('RGB', (100, 100), color='red')
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            image_data = buffer.getvalue()
            
            print("Subiendo imagen de prueba...")
            filename = "test_upload_prueba"
            result = drive_service.upload_image(image_data, filename, 'image/jpeg')
            
            if result:
                print(f"\nOK: Imagen de prueba subida exitosamente")
                print(f"   Nombre: {result}")
                print(f"\nPuedes verificarla en:")
                print(f"   https://drive.google.com/drive/folders/{GOOGLE_DRIVE_FOLDER_ID}")
            else:
                print("\nERROR: No se pudo subir la imagen de prueba")
        else:
            print("\nERROR: No se pudo verificar la carpeta")
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
