"""
Servicio de Google Drive para cuentas personales usando OAuth 2.0
"""

import io
import os
import json
import webbrowser
from typing import List, Optional, Tuple
from PIL import Image

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseUpload
    from googleapiclient.errors import HttpError
    GOOGLE_LIBS_AVAILABLE = True
except ImportError:
    GOOGLE_LIBS_AVAILABLE = False
    print("Warning: Google Drive libraries not installed")

from google_drive_personal_config import (
    GOOGLE_DRIVE_FOLDER_ID,
    GOOGLE_CREDENTIALS_FILE,
    DRIVE_FOLDER_NAME,
    IMAGE_MAX_SIZE,
    IMAGE_QUALITY,
    IMAGE_FORMAT,
    GOOGLE_TOKEN_FILE,
    GOOGLE_SCOPES
)


class GoogleDrivePersonalService:
    """Servicio para subir imagenes a Google Drive con cuenta personal"""

    def __init__(self):
        self.service = None
        self.folder_id = None
        self.creds = None
        self._initialize_service()

    def _initialize_service(self):
        """Inicializa el servicio de Google Drive"""
        if not GOOGLE_LIBS_AVAILABLE:
            print("ERROR: Librerias de Google Drive no disponibles")
            return

        try:
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            credentials_path = os.path.join(backend_dir, GOOGLE_CREDENTIALS_FILE)
            token_path = os.path.join(backend_dir, GOOGLE_TOKEN_FILE)

            if not os.path.exists(credentials_path):
                print(f"WARNING: Archivo de credenciales no encontrado: {credentials_path}")
                print("   Sigue las instrucciones en google_drive_personal_config.py")
                return

            self.creds = self._load_credentials(token_path)

            if not self.creds or not self.creds.valid:
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    print("Renovando token de acceso...")
                    try:
                        self.creds.refresh(Request())
                        self._save_credentials(token_path)
                        print("Token renovado exitosamente")
                    except Exception as e:
                        print(f"WARNING: No se pudo renovar token: {e}")
                        self.creds = None

                if not self.creds:
                    print("\nAutenticacion de Google Drive requerida")
                    print("=" * 60)
                    self.creds = self._authenticate(credentials_path, token_path)

            if self.creds:
                self.service = build('drive', 'v3', credentials=self.creds)
                print("Servicio de Google Drive inicializado")
                self.folder_id = self._get_or_create_folder()
            else:
                print("ERROR: No se pudo autenticar")

        except Exception as e:
            print(f"ERROR: Error inicializando Google Drive: {e}")
            self.service = None

    def _load_credentials(self, token_path: str) -> Optional[Credentials]:
        """Carga credenciales desde archivo de token"""
        if os.path.exists(token_path):
            try:
                with open(token_path, 'r', encoding='utf-8') as f:
                    token_data = json.load(f)
                
                creds = Credentials.from_authorized_user_info(token_data, GOOGLE_SCOPES)
                print("Credenciales cargadas desde archivo")
                return creds
            except Exception as e:
                print(f"WARNING: Error cargando credenciales: {e}")
        return None

    def _save_credentials(self, token_path: str):
        """Guarda credenciales en archivo de token"""
        try:
            with open(token_path, 'w', encoding='utf-8') as f:
                json.dump({
                    'token': self.creds.token,
                    'refresh_token': self.creds.refresh_token,
                    'token_uri': self.creds.token_uri,
                    'client_id': self.creds.client_id,
                    'client_secret': self.creds.client_secret,
                    'scopes': self.creds.scopes
                }, f, indent=2)
            print(f"Credenciales guardadas en: {token_path}")
        except Exception as e:
            print(f"WARNING: Error guardando credenciales: {e}")

    def _authenticate(self, credentials_path: str, token_path: str) -> Optional[Credentials]:
        """Autentica usando flujo OAuth 2.0"""
        try:
            print("\n1. Se abrira tu navegador para autenticacion")
            print("2. Inicia sesion con tu cuenta personal de Google")
            print("3. Acepta los permisos solicitados")
            print("\nEsperando autenticacion...")
            
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_path,
                GOOGLE_SCOPES
            )
            
            creds = flow.run_local_server(
                port=0,
                open_browser=True,
                authorization_prompt_message='Abriendo navegador... {url}',
                success_message='Autenticacion exitosa! Puedes cerrar esta ventana.'
            )
            
            with open(token_path, 'w', encoding='utf-8') as f:
                json.dump({
                    'token': creds.token,
                    'refresh_token': creds.refresh_token,
                    'token_uri': creds.token_uri,
                    'client_id': creds.client_id,
                    'client_secret': creds.client_secret,
                    'scopes': creds.scopes
                }, f, indent=2)
            
            print("Autenticacion exitosa")
            return creds
            
        except Exception as e:
            print(f"ERROR: Error en autenticacion: {e}")
            return None

    def _get_or_create_folder(self) -> Optional[str]:
        """Obtiene o verifica la carpeta de destino en Google Drive"""
        if not self.service:
            return None
        
        if GOOGLE_DRIVE_FOLDER_ID and GOOGLE_DRIVE_FOLDER_ID != "":
            try:
                print(f"Verificando carpeta configurada: {GOOGLE_DRIVE_FOLDER_ID}")
                
                folder = self.service.files().get(
                    fileId=GOOGLE_DRIVE_FOLDER_ID,
                    fields='id, name, mimeType, webViewLink',
                    supportsAllDrives=True
                ).execute()
                
                if folder.get('mimeType') == 'application/vnd.google-apps.folder':
                    print(f"Carpeta verificada: {folder['name']}")
                    print(f"   ID: {folder['id']}")
                    print(f"   URL: {folder.get('webViewLink', 'N/A')}")
                    return folder['id']
                else:
                    print("El ID no corresponde a una carpeta")
                    return None
                    
            except HttpError as e:
                if e.resp.status == 404:
                    print(f"Carpeta no encontrada. Verifica el ID: {GOOGLE_DRIVE_FOLDER_ID}")
                elif e.resp.status == 403:
                    print("No tienes permisos para acceder a la carpeta")
                    print("   Asegurate de que este compartida con tu cuenta de Google")
                else:
                    print(f"Error accediendo a la carpeta: {e}")
                return None
            except Exception as e:
                print(f"Error verificando carpeta: {e}")
                return None
        
        try:
            query = f"mimeType='application/vnd.google-apps.folder' and name='{DRIVE_FOLDER_NAME}' and trashed=false and 'root' in parents"
            results = self.service.files().list(
                q=query,
                spaces='drive',
                fields='files(id, name)'
            ).execute()
            
            files = results.get('files', [])
            
            if files:
                print(f"Carpeta encontrada: {DRIVE_FOLDER_NAME} ({files[0]['id']})")
                return files[0]['id']
            
            folder_metadata = {
                'name': DRIVE_FOLDER_NAME,
                'mimeType': 'application/vnd.google-apps.folder',
                'parents': ['root']
            }
            
            folder = self.service.files().create(
                body=folder_metadata,
                fields='id, name'
            ).execute()
            
            print(f"Carpeta creada: {DRIVE_FOLDER_NAME} ({folder['id']})")
            return folder['id']
            
        except Exception as e:
            print(f"Error obteniendo/creando carpeta: {e}")
            return None

    def standardize_image(self, image_data: bytes) -> Tuple[bytes, str]:
        """Estandariza una imagen a tamano pequeno con buena resolucion"""
        try:
            img = Image.open(io.BytesIO(image_data))
            
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            img.thumbnail((IMAGE_MAX_SIZE, IMAGE_MAX_SIZE), Image.Resampling.LANCZOS)
            
            buffer = io.BytesIO()
            img.save(buffer, format=IMAGE_FORMAT, quality=IMAGE_QUALITY, optimize=True)
            
            return buffer.getvalue(), 'image/jpeg'
            
        except Exception as e:
            print(f"Error estandarizando imagen: {e}")
            mime_type = 'image/jpeg' if image_data.startswith(b'\xff\xd8\xff') else 'image/png'
            return image_data, mime_type

    def generate_filename(self, codigo_acta: str, file_type: str, index: int = 0) -> str:
        """Genera nombre de archivo segun nomenclatura"""
        if file_type == 'a':
            prefix = 'a_'
        elif file_type == 'h':
            prefix = 'h_'
        else:
            prefix = f'{file_type}_'
        
        if index == 0:
            return f"{prefix}{codigo_acta}"
        else:
            return f"{prefix}{codigo_acta}_{index}"

    def upload_image(self, image_data: bytes, filename: str, mime_type: str = 'image/jpeg') -> Optional[str]:
        """Sube una imagen a Google Drive"""
        if not self.service:
            print("ERROR: Servicio de Google Drive no disponible")
            return None
        
        if not self.folder_id:
            print("WARNING: Folder ID no disponible, subiendo a la raiz")
        
        try:
            file_metadata = {
                'name': filename,
            }
            
            if self.folder_id:
                file_metadata['parents'] = [self.folder_id]
            
            media = MediaIoBaseUpload(
                io.BytesIO(image_data),
                mimetype=mime_type,
                resumable=True
            )
            
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, webViewLink, webContentLink'
            ).execute()
            
            self.service.permissions().create(
                fileId=file['id'],
                body={'type': 'anyone', 'role': 'reader'}
            ).execute()
            
            print(f"Imagen subida: {filename} ({file['id']})")
            return filename
            
        except HttpError as error:
            print(f"Error subiendo imagen: {error}")
            return None
        except Exception as e:
            print(f"Error inesperado subiendo imagen: {e}")
            return None

    def upload_images_batch(self, images_data: List[bytes], codigo_acta: str, file_type: str) -> List[str]:
        """Sube multiples imagenes a Google Drive"""
        uploaded_files = []
        
        for index, image_data in enumerate(images_data):
            standardized_data, mime_type = self.standardize_image(image_data)
            filename = self.generate_filename(codigo_acta, file_type, index)
            file_name = self.upload_image(standardized_data, filename, mime_type)
            
            if file_name:
                uploaded_files.append(file_name)
            else:
                print(f"WARNING: No se pudo subir: {filename}")
        
        return uploaded_files


drive_personal_service = GoogleDrivePersonalService()


def upload_acta_images(images: List[bytes], codigo_acta: str) -> List[str]:
    """Sube imagenes de acta"""
    return drive_personal_service.upload_images_batch(images, codigo_acta, 'a')


def upload_hoja_trabajo_images(images: List[bytes], codigo_acta: str) -> List[str]:
    """Sube imagenes de hoja de trabajo"""
    return drive_personal_service.upload_images_batch(images, codigo_acta, 'h')
