# 🚀 Guía Completa de Despliegue en PythonAnywhere

## ✅ Requisitos previos

- [x] Cuenta en PythonAnywhere (gratis o paga)
- [x] Base de datos `giovann$elec2026` creada
- [x] Código subido a PythonAnywhere

---

## 📦 PASO 1: Subir el código a PythonAnywhere

### Opción A: Usando Git (Recomendado)

En la **consola Bash** de PythonAnywhere:

```bash
# Clona tu repositorio
git clone https://github.com/RobertoVillegasA/elec2026-web.git ~/elec2026-web

# Navega al proyecto
cd ~/elec2026-web
```

### Opción B: Subir archivos manualmente

1. Ve a [PythonAnywhere → Files](https://www.pythonanywhere.com/files/)
2. Sube todos los archivos del proyecto a `/home/giovann/elec2026-web/`

---

## 🐍 PASO 2: Crear entorno virtual e instalar dependencias

En la **consola Bash** de PythonAnywhere:

```bash
# Navega al proyecto
cd ~/elec2026-web

# Crea un entorno virtual
python3 -m venv venv

# Activa el entorno virtual
source venv/bin/activate

# Actualiza pip
pip install --upgrade pip

# Instala las dependencias
pip install -r requirements.txt
```

**Espera a que termine la instalación** (puede tardar 2-5 minutos).

---

## 🌐 PASO 3: Configurar la Web App

### 3.1 Crear la Web App

1. Ve a [PythonAnywhere → Web](https://www.pythonanywhere.com/web/)
2. Haz clic en **"Add a new web app"**
3. Selecciona:
   - ❌ **NO** uses el wizard
   - ✅ Selecciona **"Manual configuration"**
   - Elige **Python 3.10** (o la versión más reciente)

### 3.2 Configurar la ruta del código

En la página de configuración de tu web app:

| Campo | Valor |
|-------|-------|
| **Source code** | `/home/giovann/elec2026-web` |
| **Working directory** | `/home/giovann/elec2026-web` |

### 3.3 Configurar el archivo WSGI

1. En la sección **"WSGI configuration file"**, haz clic en el enlace (ruta del archivo)
2. Se abrirá un editor
3. **Borra TODO** el contenido existente
4. Copia y pega el contenido del archivo `pythonanywhere/wsgi_production.py` de tu proyecto
5. **IMPORTANTE:** Cambia esta línea con tu contraseña real:

```python
os.environ['DB_PASSWORD'] = 'TU_CONTRASENA_AQUI'  # ← Pon tu contraseña de MySQL aquí
```

6. Guarda el archivo (Ctrl+S o botón Save)

---

## 🔧 PASO 4: Configurar el entorno virtual en PythonAnywhere

1. En la página de tu **Web App**, baja hasta **"Virtualenv"**
2. Haz clic en **"Enter path to a virtualenv"**
3. Escribe: `/home/giovann/elec2026-web/venv`
4. Presiona Enter

---

## 📁 PASO 5: Configurar archivos estáticos (Frontend)

### 5.1 Build del frontend (en tu computadora local)

En tu computadora (Windows):

```bash
cd g:\elec2026-web\frontend

# Instala dependencias (si no las tienes)
npm install

# Crea el build de producción
npm run build
```

Esto creará una carpeta `dist` con los archivos optimizados.

### 5.2 Subir el frontend a PythonAnywhere

**Opción A: Usando Git (si el dist está en el repo)**

```bash
# En la consola de PythonAnywhere
cd ~/elec2026-web/frontend
git pull origin main
```

**Opción B: Subir manualmente**

1. Ve a [PythonAnywhere → Files](https://www.pythonanywhere.com/files/)
2. Navega a `/home/giovann/elec2026-web/frontend/dist/`
3. Sube todos los archivos de `g:\elec2026-web\frontend\dist\`

### 5.3 Configurar Static Files en PythonAnywhere

En la página de tu **Web App**, sección **"Static files"**:

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/giovann/elec2026-web/frontend/dist/` |

Haz clic en **Add** para agregar esta ruta.

---

## 🔄 PASO 6: Recargar la aplicación

1. Ve a [PythonAnywhere → Web](https://www.pythonanywhere.com/web/)
2. Haz clic en el botón verde **"Reload giovann.pythonanywhere.com"**

---

## ✅ PASO 7: Verificar que funciona

### 7.1 Prueba la API

Abre en tu navegador:
```
https://giovann.pythonanywhere.com/health
```

Deberías ver:
```json
{"status": "ok"}
```

### 7.2 Prueba el frontend

Abre en tu navegador:
```
https://giovann.pythonanywhere.com/static/index.html
```

O configura el frontend para que apunte al backend correcto.

---

## 🔧 Comandos útiles en PythonAnywhere

### Ver logs de errores:
```bash
tail -f ~/.var/log/httpd/giovann_pythonanywhere_com_error.log
```

### Ver logs de la aplicación:
```bash
cat ~/.var/log/httpd/giovann_pythonanywhere_com-server.log
```

### Probar conexión a la base de datos:
```bash
mysql -u giovann -h giovann.mysql.pythonanywhere-services.com -p 'giovann$elec2026' -e "SELECT 1;"
```

### Ver tablas de la base de datos:
```bash
mysql -u giovann -h giovann.mysql.pythonanywhere-services.com -p 'giovann$elec2026' -e "SHOW TABLES;"
```

### Activar entorno virtual:
```bash
source ~/elec2026-web/venv/bin/activate
```

### Verificar instalación de paquetes:
```bash
pip list | grep fastapi
```

---

## ⚠️ Solución de problemas comunes

### ❌ Error 500 Internal Server Error

**Causa:** Error en el código o configuración

**Solución:**
```bash
# Revisa los logs
tail -100 ~/.var/log/httpd/giovann_pythonanywhere_com_error.log
```

### ❌ Error: "No module named 'fastapi'"

**Causa:** El virtualenv no está configurado correctamente

**Solución:**
1. Verifica que el virtualenv esté activado en la Web App
2. Reinstala las dependencias:
```bash
cd ~/elec2026-web
source venv/bin/activate
pip install -r requirements.txt
```

### ❌ Error: "Access denied for user 'giovann'"

**Causa:** Contraseña incorrecta o nombre de BD mal configurado

**Solución:**
1. Verifica que `DB_PASSWORD` en el WSGI file sea correcto
2. Asegúrate que `DB_NAME` sea `giovann$elec2026`

### ❌ Error: "ModuleNotFoundError: No module named 'main'"

**Causa:** El path del backend no es correcto

**Solución:**
Verifica en el WSGI file que:
```python
backend_path = os.path.join(project_home, 'backend')
```

### ❌ El frontend no carga o muestra error de CORS

**Causa:** CORS mal configurado

**Solución:**
Verifica que en el WSGI file:
```python
os.environ['CORS_ORIGIN'] = 'https://giovann.pythonanywhere.com'
```

### ❌ Error de WSGI: "callable not found"

**Causa:** El archivo WSGI no exporta `application`

**Solución:**
Asegúrate que el WSGI file tenga:
```python
application = WsgiToAsgi(app)  # o la variable que uses
```

---

## 🔐 Actualizar la contraseña de la base de datos

Si necesitas cambiar la contraseña de MySQL:

1. Ve a [PythonAnywhere → Databases](https://www.pythonanywhere.com/databases/)
2. Haz clic en **"Reset password"**
3. Genera una nueva contraseña
4. Actualiza el archivo WSGI con la nueva contraseña
5. **Recarga** tu web app

---

## 📝 Notas importantes

| Concepto | Detalle |
|----------|---------|
| **Nombre de BD** | Internamente es `giovann$elec2026`, en la conexión usas `giovann$elec2026` |
| **Host de BD** | `giovann.mysql.pythonanywhere-services.com` |
| **Virtualenv** | Siempre usa `/home/giovann/elec2026-web/venv` |
| **Logs** | `~/.var/log/httpd/giovann_pythonanywhere_com_error.log` |
| **Recargar** | Obligatorio después de cada cambio de código |
| **Límite free** | Debes recargar la app cada 3 meses o se desactiva |

---

## 🎯 Checklist final

- [ ] Código subido a `/home/giovann/elec2026-web`
- [ ] Virtualenv creado y activado
- [ ] Dependencias instaladas (`pip install -r requirements.txt`)
- [ ] Web app creada en modo manual
- [ ] WSGI file configurado con contraseña correcta
- [ ] Virtualenv path configurado en Web App
- [ ] Static files configurados (opcional para frontend)
- [ ] Web app recargada
- [ ] `/health` endpoint responde OK
- [ ] Base de datos accesible

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** - 90% de los errores están ahí
2. **Verifica paths** - Todos deben ser `/home/giovann/...`
3. **Confirma virtualenv** - Debe estar activado en Web App
4. **Prueba la BD** - Conéctate desde la consola

---

**¡Listo! Tu aplicación debería estar funcionando en PythonAnywhere** 🎉
