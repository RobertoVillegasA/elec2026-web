# 🚀 Despliegue en Render - Guía Paso a Paso

## 1. Preparar el Proyecto

### Archivos creados para Render:
- `render.yaml` - Configuración del servicio
- `web.py` - Punto de entrada para Render
- `.env.example` - Variables de entorno de ejemplo

## 2. Subir a GitHub

```bash
# Inicializar git (si no está hecho)
git init
git add .
git commit -m "Preparar para Render"

# Crear repositorio en GitHub y subir
git remote add origin https://github.com/tu-usuario/sistema-electoral.git
git push -u origin main
```

## 3. Crear Servicio en Render

1. Ve a https://render.com y crea una cuenta gratis
2. Haz clic en **"New +"** → **"Blueprint"**
3. Conecta tu repositorio de GitHub
4. Render leerá el `render.yaml` automáticamente

## 4. Configurar Variables de Entorno

En el dashboard de Render, ve a **Environment** y agrega:

```bash
SECRET_KEY=tu_clave_secreta_muy_larga
CORS_ORIGIN=https://tu-dominio.com  # o deja vacío para desarrollo
```

Las variables de la base de datos (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) se autocompletan desde la base de datos de Render.

## 5. Desplegar

Render comenzará el despliegue automáticamente. El proceso toma ~5 minutos.

### URL del backend:
```
https://sistema-electoral-backend.onrender.com
```

## 6. Frontend (Opcional)

Para subir el frontend a Render también:

```yaml
# Agregar al render.yaml
  - type: web
    name: sistema-electoral-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
```

O usa **Vercel/Netlify** para el frontend (más rápido):

```bash
cd frontend
npm install
npm run build

# En Vercel:
vercel

# En Netlify:
netlify deploy --prod
```

## 7. Migrar Base de Datos

Si ya tienes una base de datos MySQL:

1. Exporta tu DB actual:
```bash
mysqldump -u root -p elec2026 > backup.sql
```

2. Importa en Render:
```bash
# Desde el dashboard de Render, obtén las credenciales
mysql -h <host> -u <user> -p < backup.sql
```

## ⚠️ Límites del Plan Gratis

| Recurso | Límite |
|---------|--------|
| RAM | 512 MB |
| CPU | Compartida |
| Almacenamiento DB | 1 GB |
| Ancho de banda | 2 GB/mes |
| Horas de servicio | 750 hrs/mes |

**Nota:** El servicio se duerme después de 15 min de inactividad. La próxima petición tarda ~30 segundos en despertar.

## 🔧 Comandos Útiles

### Ver logs en Render:
```bash
# Desde el dashboard de Render
```

### Conectar a la DB desde local:
```bash
mysql -h <host-de-render> -u <usuario> -p sistema_electoral
```

### Probar localmente:
```bash
# Backend
cd backend
python web.py

# Frontend
cd frontend
npm run dev
```

## 📝 Notas Importantes

1. **CORS**: Asegúrate de configurar `CORS_ORIGIN` con la URL de tu frontend
2. **Base de datos**: Render usa PostgreSQL por defecto, pero puedes usar MySQL externo
3. **Secret Key**: Genera una clave segura para producción
4. **Timeout**: El plan gratis tiene timeout de 15 segundos en las peticiones

## 🆘 Solución de Problemas

### Error: "Module not found"
- Verifica que `web.py` esté en la raíz del proyecto
- Revisa que `requirements.txt` incluya todas las dependencias

### Error: "Cannot connect to database"
- Verifica las variables de entorno en Render
- Asegúrate de que la DB esté creada

### Error: CORS
- Agrega `CORS_ORIGIN` con la URL de tu frontend
- Para desarrollo: `http://localhost:5173`

## 📚 Enlaces Útiles

- [Documentación Render](https://render.com/docs)
- [FastAPI en Render](https://render.com/docs/deploy-fastapi)
- [Foro de Render](https://community.render.com)
