"""
Servicio de Microsoft OneDrive para subir imágenes de actas y hojas de trabajo
"""

import io
import os
import json
import webbrowser
from typing import List, Optional, Tuple
from PIL import Image

try:
    from msal import PublicClientApplication, SerializableTokenCache
    from requests import Session, RequestException
    MICROSOFT_LIBS_AVAILABLE = True
except ImportError:
    MICROSOFT_LIBS_AVAILABLE = False
    print("⚠️ Librerías de Microsoft no instaladas. Ejecuta: pip install msal requests")

from onedrive_config import (
    ONEDRIVE_CLIENT_ID,
    ONEDRIVE_CLIENT_SECRET,
    ONEDRIVE_TENANT_ID,
    ONEDRIVE_FOLDER_NAME,
    IMAGE_MAX_SIZE,
    IMAGE_QUALITY,
    IMAGE_FORMAT,
    ONEDRIVE_TOKEN_FILE
)


class OneDriveService:
    """Servicio para subir imágenes a OneDrive"""
    
    def __init__(self):
        self.session = None
        self.folder_id = None
        self.access_token = None
        self._initialize_service()
    
    def _initialize_service(self):
        """Inicializa el servicio de OneDrive"""
        if not MICROSOFT_LIBS_AVAILABLE:
            print("❌ Librerías de Microsoft no disponibles")
            return
        
        try:
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            token_path = os.path.join(backend_dir, ONEDRIVE_TOKEN_FILE)
            
            # Configurar MSAL
            self.app = PublicClientApplication(
                client_id=ONEDRIVE_CLIENT_ID,
                client_credential=ONEDRIVE_CLIENT_SECRET,
                authority=f"https://login.microsoftonline.com/{ONEDRIVE_TENANT_ID}",
                token_cache=SerializableTokenCache()
            )
            
            # Intentar cargar token existente
            self.access_token = self._load_or_acquire_token(token_path)
            
            if self.access_token:
                self.session = Session()
                self.session.headers.update({
                    'Authorization': f'Bearer {self.access_token}'
                })
                print("✅ Servicio de OneDrive inicializado")
                
                # Crear o verificar carpeta de destino
                self.folder_id = self._get_or_create_folder()
            else:
                print("❌ No se pudo obtener token de acceso")
            
        except Exception as e:
            print(f"❌ Error inicializando OneDrive: {e}")
            self.session = None
    
    def _load_or_acquire_token(self, token_path: str) -> Optional[str]:
        """Carga token existente o adquiere uno nuevo"""
        # Intentar cargar token cacheado
        if os.path.exists(token_path):
            try:
                with open(token_path, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
                
                cache = SerializableTokenCache()
                cache.deserialize(json.dumps(cache_data))
                
                # Buscar token en caché
                accounts = self.app.get_accounts()
                if accounts:
                    result = self.app.acquire_token_silent(
                        scopes=['Files.ReadWrite', 'Files.ReadWrite.All', 'offline_access'],
                        account=accounts[0]
                    )
                    if result and 'access_token' in result:
                        print("✅ Token cargado desde caché")
                        return result['access_token']
            except Exception as e:
                print(f"⚠️ Error cargando token caché: {e}")
        
        # Adquirir nuevo token usando flujo de dispositivo
        return self._acquire_device_token(token_path)
    
    def _acquire_device_token(self, token_path: str) -> Optional[str]:
        """Adquiere token usando flujo de dispositivo"""
        try:
            print("\n🔐 Autenticación de OneDrive requerida")
            print("=" * 60)
            
            # Flujo de dispositivo
            flow = self.app.initiate_device_flow_initiative(
                scopes=['Files.ReadWrite', 'Files.ReadWrite.All', 'offline_access']
            )
            
            if 'verification_uri' in flow and 'user_code' in flow:
                print(f"\n1. Abre tu navegador y ve a: {flow['verification_uri']}")
                print(f"2. Ingresa el código: {flow['user_code']}")
                print(f"3. Inicia sesión con tu cuenta Microsoft personal")
                print("\nEsperando autenticación...")
                
                # Abrir navegador automáticamente
                webbrowser.open(flow['verification_uri'])
            
            result = self.app.acquire_token_by_device_flow(flow)
            
            if 'access_token' in result:
                print("✅ Autenticación exitosa")
                
                # Guardar token en caché
                with open(token_path, 'w', encoding='utf-8') as f:
                    json.dump(json.loads(result['id_token_claims']), f, indent=2)
                print(f"✅ Token guardado en: {token_path}")
                
                return result['access_token']
            else:
                print(f"❌ Error obteniendo token: {result.get('error_description', 'Error desconocido')}")
                return None
                
        except Exception as e:
            print(f"❌ Error en autenticación: {e}")
            return None
    
    def _get_or_create_folder(self) -> Optional[str]:
        """Obtiene o crea la carpeta de destino en OneDrive"""
        if not self.session:
            return None
        
        try:
            # Buscar carpeta en raíz de OneDrive
            endpoint = "https://graph.microsoft.com/v1.0/me/drive/root"
            
            # Intentar obtener la carpeta
            response = self.session.get(
                f"{endpoint}:/{ONEDRIVE_FOLDER_NAME}:",
                params={'select': 'id,name,folder'}
            )
            
            if response.status_code == 200:
                folder_data = response.json()
                if 'folder' in folder_data:
                    print(f"✅ Carpeta encontrada: {ONEDRIVE_FOLDER_NAME} ({folder_data['id']})")
                    return folder_data['id']
            
            # Crear carpeta nueva
            response = self.session.post(
                f"{endpoint}/children",
                json={
                    'name': ONEDRIVE_FOLDER_NAME,
                    'folder': {}
                }
            )
            
            if response.status_code == 200:
                folder_data = response.json()
                print(f"✅ Carpeta creada: {ONEDRIVE_FOLDER_NAME} ({folder_data['id']})")
                return folder_data['id']
            else:
                print(f"⚠️ No se pudo crear carpeta: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error obteniendo/creando carpeta: {e}")
            return None
    
    def standardize_image(self, image_data: bytes) -> Tuple[bytes, str]:
        """
        Estandariza una imagen a tamaño pequeño con buena resolución
        
        Args:
            image_data: Datos binarios de la imagen original
            
        Returns:
            Tuple con (datos_binarios_estandarizados, mime_type)
        """
        try:
            # Abrir imagen con PIL
            img = Image.open(io.BytesIO(image_data))
            
            # Convertir a RGB si es necesario
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Redimensionar manteniendo aspect ratio
            img.thumbnail((IMAGE_MAX_SIZE, IMAGE_MAX_SIZE), Image.Resampling.LANCZOS)
            
            # Guardar en buffer
            buffer = io.BytesIO()
            img.save(
                buffer,
                format=IMAGE_FORMAT,
                quality=IMAGE_QUALITY,
                optimize=True
            )
            
            return buffer.getvalue(), 'image/jpeg'
            
        except Exception as e:
            print(f"❌ Error estandarizando imagen: {e}")
            # Retornar imagen original si falla
            mime_type = 'image/jpeg' if image_data.startswith(b'\xff\xd8\xff') else 'image/png'
            return image_data, mime_type
    
    def generate_filename(self, codigo_acta: str, file_type: str, index: int = 0) -> str:
        """
        Genera nombre de archivo según la nomenclatura especificada
        
        Args:
            codigo_acta: Código del acta
            file_type: 'a' para acta, 'h' para hoja de trabajo
            index: Índice para múltiples fotos (0 = sin sufijo)
            
        Returns:
            Nombre de archivo estandarizado
        """
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
        """
        Sube una imagen a OneDrive
        
        Args:
            image_data: Datos binarios de la imagen
            filename: Nombre del archivo en OneDrive
            mime_type: Tipo MIME de la imagen
            
        Returns:
            ID/nombre del archivo subido o None si falla
        """
        if not self.session:
            print("❌ Servicio de OneDrive no disponible")
            return None
        
        try:
            # Construir endpoint para subir archivo
            if self.folder_id:
                endpoint = f"https://graph.microsoft.com/v1.0/me/drive/items/{self.folder_id}:/{filename}:/content"
            else:
                # Subir a raíz si no hay carpeta
                endpoint = f"https://graph.microsoft.com/v1.0/me/drive/root:/{filename}:/content"
            
            # Subir archivo
            response = self.session.put(
                endpoint,
                data=image_data,
                headers={'Content-Type': mime_type}
            )
            
            if response.status_code in [200, 201]:
                file_data = response.json()
                file_id = file_data.get('id', filename)
                web_url = file_data.get('webUrl', '')
                print(f"✅ Imagen subida: {filename} ({file_id})")
                return filename  # Retornamos el nombre para la BD
            else:
                print(f"❌ Error subiendo imagen: {response.status_code} - {response.text}")
                return None
                
        except RequestException as e:
            print(f"❌ Error de red subiendo imagen: {e}")
            return None
        except Exception as e:
            print(f"❌ Error inesperado subiendo imagen: {e}")
            return None
    
    def upload_images_batch(
        self,
        images_data: List[bytes],
        codigo_acta: str,
        file_type: str
    ) -> List[str]:
        """
        Sube múltiples imágenes a OneDrive
        
        Args:
            images_data: Lista de datos binarios de imágenes
            codigo_acta: Código del acta
            file_type: 'a' para acta, 'h' para hoja de trabajo
            
        Returns:
            Lista de nombres de archivos subidos
        """
        uploaded_files = []
        
        for index, image_data in enumerate(images_data):
            # Estandarizar imagen
            standardized_data, mime_type = self.standardize_image(image_data)
            
            # Generar nombre
            filename = self.generate_filename(codigo_acta, file_type, index)
            
            # Subir imagen
            file_name = self.upload_image(standardized_data, filename, mime_type)
            
            if file_name:
                uploaded_files.append(file_name)
            else:
                print(f"⚠️ No se pudo subir: {filename}")
        
        return uploaded_files


# Instancia global del servicio
onedrive_service = OneDriveService()


def upload_acta_images(images: List[bytes], codigo_acta: str) -> List[str]:
    """
    Función conveniente para subir imágenes de acta
    
    Args:
        images: Lista de datos binarios de imágenes
        codigo_acta: Código del acta
        
    Returns:
        Lista de nombres de archivos subidos
    """
    return onedrive_service.upload_images_batch(images, codigo_acta, 'a')


def upload_hoja_trabajo_images(images: List[bytes], codigo_acta: str) -> List[str]:
    """
    Función conveniente para subir imágenes de hoja de trabajo
    
    Args:
        images: Lista de datos binarios de imágenes
        codigo_acta: Código del acta
        
    Returns:
        Lista de nombres de archivos subidos
    """
    return onedrive_service.upload_images_batch(images, codigo_acta, 'h')
