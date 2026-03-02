#!/usr/bin/env python3
"""
Script para listar carpetas accesibles con OAuth
"""

import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

print("=" * 70)
print("LISTADO DE CARPETAS ACCESIBLES (OAuth)")
print("=" * 70)

try:
    from google_drive_service import drive_service
    
    if drive_service.service:
        print("\nOK: Servicio de Google Drive inicializado")
        
        print("\nBuscando carpetas accesibles...")
        results = drive_service.service.files().list(
            q="mimeType='application/vnd.google-apps.folder' and trashed=false",
            spaces='drive',
            fields='files(id, name, owners, webViewLink)',
            pageSize=20
        ).execute()
        
        files = results.get('files', [])
        
        if files:
            print(f"\nSe encontraron {len(files)} carpetas:")
            for file in files:
                owner = file.get('owners', [{}])[0].get('emailAddress', 'N/A')
                print(f"\n   Nombre: {file['name']}")
                print(f"   ID: {file['id']}")
                print(f"   Owner: {owner}")
                print(f"   URL: {file.get('webViewLink', 'N/A')}")
        else:
            print("   No se encontraron carpetas")
            
        # Verificar carpeta específica
        print("\n" + "=" * 70)
        print("VERIFICANDO CARPETA ESPECIFICA")
        print("=" * 70)
        folder_id = '1yhn0-ictjw7z1i2oO3MhPcT3ZOh8kaa9'
        print(f"\nBuscando carpeta: {folder_id}")
        
        folder_found = False
        for file in files:
            if file['id'] == folder_id:
                folder_found = True
                print(f"   ENCONTRADA: {file['name']}")
                break
        
        if not folder_found:
            print("   NO ENCONTRADA en la lista")
            print("\n   POSIBLE SOLUCION:")
            print("   1. Abre la carpeta en tu navegador")
            print("   2. Haz clic en 'Compartir'")
            print("   3. Agrega el email de la cuenta que usaste para autenticar")
            print("   4. Dale permisos de EDITOR")
        
    else:
        print("\nERROR: Servicio no disponible")
        
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
