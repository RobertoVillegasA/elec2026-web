# Checklist de Despliegue - PythonAnywhere

## 📋 Pre-despliegue

### Archivos a modificar antes de subir
- [ ] `backend/main.py`: Actualizar CORS con tu dominio de PythonAnywhere
- [ ] `frontend/src/services/api.js`: Ya está configurado para detectar automáticamente pythonanywhere.com
- [ ] `backend/.env`: Crear con las credenciales de MySQL de PythonAnywhere

### Build del frontend
- [ ] Ejecutar `npm run build` en local
- [ ] Verificar que se creó la carpeta `frontend/dist`

---

## 🗄️ Base de Datos

- [ ] Crear database `electoral2026` en PythonAnywhere
- [ ] Anotar credenciales:
  - Host: `____________________.mysql.pythonanywhere-services.com`
  - Database: `____________________$electoral2026`
  - User: `____________________`
  - Password: `____________________`
- [ ] Exportar DB local: `mysqldump -u root -p elec2026 > electoral2026.sql`
- [ ] Importar en PythonAnywhere vía phpMyAdmin

---

## 🐍 Backend

- [ ] Subir carpeta `backend` a `/home/tu_usuario/electoral2026/backend`
- [ ] Crear entorno virtual: `python3 -m venv venv`
- [ ] Activar: `source venv/bin/activate`
- [ ] Instalar: `pip install -r requirements.txt`
- [ ] Crear `.env` con las credenciales de MySQL

---

## 🌐 Web App

- [ ] Crear nueva web app (Manual configuration)
- [ ] Python 3.10 seleccionado
- [ ] Editar WSGI file en `/var/www/tu_usuario_pythonanywhere_com_wsgi.py`
- [ ] Configurar static files:
  - URL: `/`
  - Directory: `/home/tu_usuario/electoral2026/frontend/dist`

---

## ✅ Testing

- [ ] Dar Reload a la aplicación
- [ ] Visitar `https://tu_usuario.pythonanywhere.com`
- [ ] Probar login
- [ ] Probar carga de delegados
- [ ] Revisar logs en caso de error

---

## 🔗 URLs Importantes

- **Web App**: `https://tu_usuario.pythonanywhere.com`
- **API Docs**: `https://tu_usuario.pythonanywhere.com/docs`
- **phpMyAdmin**: `https://www.pythonanywhere.com/databases/`
- **Logs**: `https://www.pythonanywhere.com/files/var/log/`
