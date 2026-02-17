# Requisitos y pasos para correr el sistema electoral completo

## Requisitos del sistema

### Backend (Python)
- Python 3.8 o superior
- pip (gestor de paquetes de Python)
- MySQL Server instalado y corriendo

### Frontend (JavaScript/React)
- Node.js 16 o superior
- npm (gestor de paquetes de Node.js)

## Instalación de dependencias

### Backend
1. Navega al directorio backend:
```bash
cd g:\elec2026-web\backend
```

2. Instala las dependencias:
```bash
pip install fastapi uvicorn python-multipart mysql-connector-python bcrypt python-dotenv pydantic
```

3. Configura el archivo .env con los datos de conexión a la base de datos:
```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=elec2026
```

### Frontend
1. Navega al directorio frontend:
```bash
cd g:\elec2026-web\frontend
```

2. Instala las dependencias:
```bash
npm install
```

## Configuración de la base de datos

1. Crea una base de datos MySQL llamada `elec2026`
2. Asegúrate de que las tablas `actas` y `votos_detalle` existan con las columnas necesarias:
   - En `actas`: `id_cargo_alca`, `id_cargo_cons`, `votos_blancos_a`, `votos_nulos_a`, `votos_blancos_c`, `votos_nulos_c`, etc.
   - En `votos_detalle`: `tipo_voto` (ENUM con valores para 'ALCALDE', 'CONCEJAL', etc.)

## Ejecución del sistema

### Paso 1: Iniciar el servidor backend
1. Abre una nueva terminal
2. Navega al directorio backend:
```bash
cd g:\elec2026-web\backend
```
3. Inicia el servidor:
```bash
uvicorn main:app --reload --port 8000
```

### Paso 2: Iniciar el servidor frontend
1. Abre otra terminal (diferente a la del backend)
2. Navega al directorio frontend:
```bash
cd g:\elec2026-web\frontend
```
3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Verificación de funcionamiento

### Backend
- Visita http://localhost:8000/docs para ver la documentación de la API
- Visita http://localhost:8000/api/catalog?table=departamentos para verificar la conexión

### Frontend
- El frontend se abrirá en http://localhost:5173 (o el puerto que indique npm)
- Puedes navegar a la página de EscrutinioMunicipal

## Componentes importantes

### EscrutinioMunicipal.jsx
- Filtra organizaciones políticas que contengan "LIBRE" en su nombre
- Permite ingresar votos diferenciados para alcalde y concejal
- Valida que los totales no excedan la cantidad de inscritos
- Envía datos al endpoint `/api/escrutinio/municipal`

## Solución de problemas comunes

### Error de conexión backend
- Asegúrate que el servidor backend esté corriendo en el puerto 8000
- Verifica que el archivo .env tenga los datos correctos de conexión

### Error de CORS
- El backend ya tiene configurado CORS para permitir conexiones desde http://localhost:5173

### Problemas con el formulario
- Verifica que los campos requeridos estén completos
- Asegúrate de usar un código de acta único
- Confirma que los totales de votos no excedan la cantidad de inscritos

## Notas importantes

- Ambos servidores (backend y frontend) deben estar corriendo simultáneamente
- El backend maneja la lógica de negocio y la base de datos
- El frontend consume los servicios del backend
- Las correcciones aplicadas para diferenciar votos de alcalde y concejal están implementadas