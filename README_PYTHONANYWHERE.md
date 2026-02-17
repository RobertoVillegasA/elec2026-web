# 🚀 Guía Rápida - Desplegar en PythonAnywhere

## Pasos Esenciales (5 minutos)

### 1. Subir el código
```bash
# En la consola de PythonAnywhere
git clone https://github.com/tu_usuario/tu_repositorio.git /home/tu_usuario/electoral2026
cd /home/tu_usuario/electoral2026
```

### 2. Configurar entorno virtual
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configurar base de datos
- Ve a **Databases** → Crea DB `electoral2026`
- Copia las credenciales
- Crea `/home/tu_usuario/electoral2026/backend/.env`:
```env
DB_HOST=tu_usuario.mysql.pythonanywhere-services.com
DB_NAME=tu_usuario$electoral2026
DB_USER=tu_usuario
DB_PASSWORD=tu_password
```

### 4. Importar datos
- Ve a **Databases** → phpMyAdmin
- Importa tu SQL local

### 5. Configurar Web App
- **Web** → **Add a new web app** → **Manual configuration**
- Python 3.10
- **WSGI file**: Reemplaza contenido con `pythonanywhere/wsgi_production.py`
- **Static files**: Agrega `/` → `/home/tu_usuario/electoral2026/frontend/dist`

### 6. Build frontend (en tu PC)
```bash
cd frontend
npm run build
# Sube 'dist' a /home/tu_usuario/electoral2026/frontend/dist
```

### 7. ¡Reload!
- Botón verde **Reload** en la pestaña **Web**

---

## 📁 Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `DEPLOY_PYTHONANYWHERE.md` | Guía completa detallada |
| `CHECKLIST_DESPLEGUE.md` | Checklist paso a paso |
| `pythonanywhere/wsgi_production.py` | Configuración WSGI |
| `build_pythonanywhere.bat` | Script build (Windows) |
| `build_pythonanywhere.sh` | Script build (Linux/Mac) |

---

## ⚠️ Importante

1. **CORS**: Edita `backend/main.py` y cambia `tu_usuario` por tu usuario real
2. **WSGI**: Edita el archivo WSGI con tus credenciales reales
3. **Frontend**: El archivo `api.js` ya detecta automáticamente pythonanywhere.com

---

## 🔍 Debugging

- **Logs**: `/var/log/tu_usuario.pythonanywhere.com.error.log`
- **DB**: phpMyAdmin desde la pestaña Databases
- **Console**: Usa la consola de PythonAnywhere para tests

---

## ✅ Test Post-Despliegue

1. `https://tu_usuario.pythonanywhere.com/` → Frontend
2. `https://tu_usuario.pythonanywhere.com/docs` → API Docs
3. `https://tu_usuario.pythonanywhere.com/api/catalog?table=departamentos` → API Test
