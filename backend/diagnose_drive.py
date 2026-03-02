#!/usr/bin/env python3
"""
Script de diagnostico para Google Drive
"""

import os
import sys
import json

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

print("=" * 70)
print("DIAGNOSTICO DE GOOGLE DRIVE")
print("=" * 70)

# 1. Verificar archivo de credenciales
credentials_path = os.path.join(backend_dir, 'google_credentials.json')
print("\n1. Verificando archivo de credenciales...")
if os.path.exists(credentials_path):
    print(f"   OK: Archivo existe: {credentials_path}")
    try:
        with open(credentials_path, 'r', encoding='utf-8') as f:
            creds_data = json.load(f)
        print(f"   OK: Archivo JSON valido")
        print(f"   Type: {creds_data.get('type', 'N/A')}")
        print(f"   Project ID: {creds_data.get('project_id', 'N/A')}")
        print(f"   Client Email: {creds_data.get('client_email', 'N/A')}")
    except Exception as e:
        print(f"   ERROR: No se pudo leer el JSON: {e}")
else:
    print(f"   ERROR: Archivo no existe: {credentials_path}")

# 2. Intentar autenticar
print("\n2. Intentando autenticar...")
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    
    creds = service_account.Credentials.from_service_account_file(
        credentials_path,
        scopes=['https://www.googleapis.com/auth/drive']
    )
    
    service = build('drive', 'v3', credentials=creds)
    print("   OK: Autenticacion exitosa")
    
    # 3. Obtener informacion de la cuenta
    print("\n3. Informacion de la cuenta:")
    print(f"   Email: {creds_data.get('client_email', 'N/A')}")
    
    # 4. Listar archivos accesibles
    print("\n4. Buscando carpetas accesibles...")
    try:
        results = service.files().list(
            q="mimeType='application/vnd.google-apps.folder' and trashed=false",
            spaces='drive',
            fields='files(id, name, owners)',
            pageSize=10,
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
            corpora='allDrives'
        ).execute()
        
        files = results.get('files', [])
        
        if files:
            print(f"   OK: Se encontraron {len(files)} carpetas:")
            for file in files:
                owners = file.get('owners', [{}])[0]
                owner_email = owners.get('emailAddress', 'N/A') if owners else 'N/A'
                print(f"      - {file['name']} ({file['id']})")
                print(f"        Owner: {owner_email}")
                
                # Verificar si es la carpeta que buscamos
                if '1yhn0-ictjw7z1i2oO3MhPcT3ZOH8kaa9' in file['id']:
                    print(f"        >>> ESTA ES LA CARPETA QUE BUSCAMOS!")
        else:
            print("   WARNING: No se encontraron carpetas")
            
    except Exception as e:
        print(f"   ERROR: No se pudo listar archivos: {e}")
    
    # 5. Intentar acceder a la carpeta especifica
    print("\n5. Intentando acceder a la carpeta especifica...")
    folder_id = '1yhn0-ictjw7z1i2oO3MhPcT3ZOH8kaa9'
    try:
        folder = service.files().get(
            fileId=folder_id,
            fields='id, name, mimeType, owners, permissions',
            supportsAllDrives=True
        ).execute()
        
        print(f"   OK: Carpeta encontrada!")
        print(f"      Nombre: {folder.get('name', 'N/A')}")
        print(f"      ID: {folder.get('id', 'N/A')}")
        print(f"      Owners: {folder.get('owners', [{}])[0].get('emailAddress', 'N/A')}")
        
    except Exception as e:
        print(f"   ERROR: No se pudo acceder a la carpeta: {e}")
        print(f"\n   POSIBLE SOLUCION:")
        print(f"   1. Abre la carpeta en tu navegador:")
        print(f"      https://drive.google.com/drive/folders/{folder_id}")
        print(f"   2. Haz clic en 'Compartir'")
        print(f"   3. Agrega el email: {creds_data.get('client_email', 'N/A')}")
        print(f"   4. Dale permisos de EDITOR")
        print(f"   5. Guarda los cambios")
        
except Exception as e:
    print(f"   ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("Diagnostico completado")
print("=" * 70)
