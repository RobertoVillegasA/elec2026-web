# 🎨 Despliegue del Frontend en PythonAnywhere

## 📦 Paso 1: Build del Frontend (Local)

En tu computadora (Windows):

```bash
cd g:\elec2026-web\frontend

# Instalar dependencias (si no las tienes)
npm install

# Crear build de producción
npm run build
```

Esto generará la carpeta `dist/` con los archivos optimizados.

---

## 📤 Paso 2: Subir el Frontend a PythonAnywhere

### Opción A: Usando Git (Recomendado)

Si el `dist/` está en tu repositorio:

```bash
# En la consola Bash de PythonAnywhere
cd ~/elec2026-web/frontend
git pull origin main
```

### Opción B: Subir manualmente vía Web

1. Andá a [PythonAnywhere → Files](https://www.pythonanywhere.com/files/)
2. Navegá a `/home/giovann/elec2026-web/frontend/`
3. Creá la carpeta `dist` si no existe
4. Subí todos los archivos de `g:\elec2026-web\frontend\dist\` a `/home/giovann/elec2026-web/frontend/dist/`

### Opción C: Usando SCP/FTP

```bash
# Desde tu computadora (PowerShell o terminal)
scp -r dist/* giovann@ssh.pythonanywhere.com:/home/giovann/elec2026-web/frontend/dist/
```

---

## 🌐 Paso 3: Configurar Static Files en PythonAnywhere

1. Andá a [PythonAnywhere → Web](https://www.pythonanywhere.com/web/)
2. Hacé clic en tu app `giovann.pythonanywhere.com`
3. Bajá hasta la sección **"Static files"**
4. Agregá esta ruta:

| URL | Directory |
|-----|-----------|
| `/` | `/home/giovann/elec2026-web/frontend/dist/` |

**Importante:** Esta configuración hace que el frontend se sirva desde la raíz del dominio.

---

## ⚠️ Problema: Conflicto con la API

Si configurás el static file en `/`, las rutas de la API (`/health`, `/docs`, etc.) pueden entrar en conflicto.

### Solución 1: Usar subruta para el frontend (Recomendado)

En **Static files**, configurá:

| URL | Directory |
|-----|-----------|
| `/app/` | `/home/giovann/elec2026-web/frontend/dist/` |

El frontend estará en: `https://giovann.pythonanywhere.com/app/`

### Solución 2: Usar dominio separado

Configurá un subdominio para el frontend:
- `app.giovann.pythonanywhere.com` → Frontend
- `giovann.pythonanywhere.com` → API

---

## 🔧 Paso 4: Configurar el frontend para usar la subruta

Si usás la **Solución 1** (frontend en `/app/`), actualizá el `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: 'localhost'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    sourcemap: false,
    minify: 'terser'
  },
  base: '/app/'  // ← Agregar esta línea si usás subruta
})
```

Luego hacé otro build:

```bash
npm run build
```

Y volvé a subir los archivos a PythonAnywhere.

---

## ✅ Paso 5: Verificar

### Si el frontend está en la raíz:
```
https://giovann.pythonanywhere.com/
```

### Si el frontend está en subruta:
```
https://giovann.pythonanywhere.com/app/
```

---

## 🎯 Configuración recomendada

### Para desarrollo:
- Frontend: `http://localhost:5173`
- API: `https://giovann.pythonanywhere.com`

### Para producción:
- Frontend: `https://giovann.pythonanywhere.com/app/`
- API: `https://giovann.pythonanywhere.com`

---

## 📝 Verificación de CORS

El backend ya está configurado para aceptar peticiones desde PythonAnywhere. Verificá que en el WSGI file esté:

```python
os.environ['CORS_ORIGIN'] = 'https://giovann.pythonanywhere.com'
```

---

## 🔍 Solución de problemas

### ❌ El frontend carga pero no muestra datos

**Causa:** Error de CORS o API URL incorrecta

**Solución:**
1. Abrí la consola del navegador (F12)
2. Verificá que `VITE_API_URL` apunte a `https://giovann.pythonanywhere.com`
3. Verificá que el backend permita CORS desde ese dominio

### ❌ Error 404 en los archivos estáticos

**Causa:** La ruta de static files es incorrecta

**Solución:**
1. Verificá que los archivos estén en `/home/giovann/elec2026-web/frontend/dist/`
2. Verificá que la URL en Static files apunte a esa carpeta exacta

### ❌ La API no responde desde el frontend

**Causa:** CORS mal configurado

**Solución:**
1. En el backend, verificá que `CORS_ORIGIN` esté configurado
2. Recargá la app en PythonAnywhere

---

## 🎉 Checklist final

- [ ] Build del frontend generado (`npm run build`)
- [ ] Archivos subidos a `/home/giovann/elec2026-web/frontend/dist/`
- [ ] Static file configurado en PythonAnywhere Web
- [ ] `VITE_API_URL` configurado correctamente
- [ ] CORS configurado en el backend
- [ ] Frontend accesible en la URL configurada
- [ ] API responde desde el frontend

---

**¡Listo! Tu frontend debería estar funcionando en PythonAnywhere** 🎨
