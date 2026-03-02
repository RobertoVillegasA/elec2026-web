"""
Servicio para manejar subida de imagenes a Google Drive
para el sistema electoral
"""

from typing import List, Optional

def process_images_sync(images_data: List[bytes], codigo_acta: str, file_type: str) -> List[str]:
    """
    Procesa y sube imagenes a Google Drive de forma sincrona
    """
    try:
        from google_drive_service import drive_service
        
        if not drive_service.service:
            print("WARNING: Google Drive no configurado. Usando nombres simulados.")
            return simulate_upload(images_data, codigo_acta, file_type)
        
        uploaded_files = []
        
        for index, image_data in enumerate(images_data):
            standardized_data, mime_type = drive_service.standardize_image(image_data)
            filename = drive_service.generate_filename(codigo_acta, file_type, index)
            file_name = drive_service.upload_image(standardized_data, filename, mime_type)
            
            if file_name:
                uploaded_files.append(file_name)
            else:
                print(f"WARNING: No se pudo subir: {filename}")
        
        return uploaded_files
        
    except Exception as e:
        print(f"Error procesando imagenes: {e}")
        return simulate_upload(images_data, codigo_acta, file_type)


def simulate_upload(images_data: List[bytes], codigo_acta: str, file_type: str) -> List[str]:
    """
    Simula la subida generando nombres de archivo sin subir a Drive
    """
    filenames = []
    for index in range(len(images_data)):
        if file_type == 'a':
            prefix = 'a_'
        elif file_type == 'h':
            prefix = 'h_'
        else:
            prefix = f'{file_type}_'
        
        if index == 0:
            filename = f"{prefix}{codigo_acta}"
        else:
            filename = f"{prefix}{codigo_acta}_{index}"
        
        filenames.append(filename)
    
    return filenames


def upload_acta_images(images: List[bytes], codigo_acta: str) -> List[str]:
    """Sube imagenes de acta a Google Drive"""
    return process_images_sync(images, codigo_acta, 'a')


def upload_hoja_trabajo_images(images: List[bytes], codigo_acta: str) -> List[str]:
    """Sube imagenes de hoja de trabajo a Google Drive"""
    return process_images_sync(images, codigo_acta, 'h')
