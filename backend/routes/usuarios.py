# backend/routes/usuarios.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from db import DatabaseConnection
import hashlib

router = APIRouter()

# ========== MODELOS PYDANTIC ==========

class RolBase(BaseModel):
    nombre_rol: str = Field(..., min_length=1, max_length=50)

class RolCreate(RolBase):
    pass

class RolUpdate(BaseModel):
    nombre_rol: Optional[str] = None

class UsuarioBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    fullname: str = Field(..., min_length=3, max_length=100)
    id_rol: int
    id_departamento: Optional[int] = None

class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6)

class UsuarioUpdate(BaseModel):
    fullname: Optional[str] = None
    id_rol: Optional[int] = None
    id_departamento: Optional[int] = None

class UsuarioChangePassword(BaseModel):
    password_actual: Optional[str] = None
    password_nueva: str = Field(..., min_length=6)


# ========== FUNCIONES AUXILIARES ==========

# ========== ENDPOINTS DE ROLES ==========

@router.get("/roles")
async def listar_roles():
    """Obtiene todos los roles disponibles"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_rol, nombre_rol
                FROM roles
                ORDER BY nombre_rol ASC
            """)
            
            roles = cursor.fetchall()
            cursor.close()
            return roles
            
    except Exception as e:
        print(f"❌ Error al listar roles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/roles/{id_rol}")
async def obtener_rol(id_rol: int):
    """Obtiene los detalles de un rol específico"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_rol, nombre_rol
                FROM roles
                WHERE id_rol = %s
            """, (id_rol,))
            
            rol = cursor.fetchone()
            cursor.close()
            
            if not rol:
                raise HTTPException(status_code=404, detail="Rol no encontrado")
            
            return rol
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener rol: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/roles")
async def crear_rol(rol: RolCreate):
    """Crea un nuevo rol"""
    try:
        if not rol.nombre_rol or not rol.nombre_rol.strip():
            raise HTTPException(status_code=400, detail="El nombre del rol no puede estar vacío")
        
        nombre_rol = rol.nombre_rol.strip()
        
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor()
            
            # Verificar que el rol no exista
            cursor.execute("SELECT id_rol FROM roles WHERE nombre_rol = %s", (nombre_rol,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail=f"El rol '{nombre_rol}' ya existe")
            
            # Crear rol
            cursor.execute("""
                INSERT INTO roles (nombre_rol)
                VALUES (%s)
            """, (nombre_rol,))
            
            cursor.close()
            return {
                "message": "✅ Rol creado exitosamente",
                "id_rol": cursor.lastrowid
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al crear rol: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/roles/{id_rol}")
async def actualizar_rol(id_rol: int, rol: RolUpdate):
    """Actualiza un rol existente"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor()
            
            # Verificar que el rol existe
            cursor.execute("SELECT id_rol FROM roles WHERE id_rol = %s", (id_rol,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Rol no encontrado")
            
            # Verificar nombre único si se está actualizando
            if rol.nombre_rol:
                nombre_rol = rol.nombre_rol.strip()
                cursor.execute("SELECT id_rol FROM roles WHERE nombre_rol = %s AND id_rol != %s", 
                              (nombre_rol, id_rol))
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail=f"El rol '{nombre_rol}' ya existe")
                
                cursor.execute("UPDATE roles SET nombre_rol = %s WHERE id_rol = %s", (nombre_rol, id_rol))
            
            cursor.close()
            return {"message": "✅ Rol actualizado exitosamente", "id_rol": id_rol}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al actualizar rol: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/roles/{id_rol}")
async def eliminar_rol(id_rol: int):
    """Elimina un rol"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor()
            
            # Verificar que el rol existe
            cursor.execute("SELECT id_rol FROM roles WHERE id_rol = %s", (id_rol,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Rol no encontrado")
            
            # Verificar que no hay usuarios con este rol
            cursor.execute("SELECT COUNT(*) as count FROM usuarios WHERE id_rol = %s", (id_rol,))
            result = cursor.fetchone()
            if result and result[0] > 0:
                raise HTTPException(status_code=400, 
                                  detail="No se puede eliminar un rol que tiene usuarios asignados")
            
            # Eliminar rol
            cursor.execute("DELETE FROM roles WHERE id_rol = %s", (id_rol,))
            
            cursor.close()
            return {"message": "✅ Rol eliminado exitosamente", "id_rol": id_rol}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al eliminar rol: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== ENDPOINTS DE USUARIOS ==========

@router.get("/usuarios")
async def listar_usuarios():
    """Obtiene todos los usuarios"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    u.id_usuario, u.username, u.fullname,
                    u.id_rol, r.nombre_rol, u.id_departamento
                FROM usuarios u
                LEFT JOIN roles r ON u.id_rol = r.id_rol
                ORDER BY u.username ASC
            """)
            
            usuarios = cursor.fetchall()
            cursor.close()
            return usuarios
            
    except Exception as e:
        print(f"❌ Error al listar usuarios: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usuarios/{id_usuario}")
async def obtener_usuario(id_usuario: int):
    """Obtiene los detalles de un usuario"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    u.id_usuario, u.username, u.fullname,
                    u.id_rol, r.nombre_rol, u.id_departamento
                FROM usuarios u
                LEFT JOIN roles r ON u.id_rol = r.id_rol
                WHERE u.id_usuario = %s
            """, (id_usuario,))
            
            usuario = cursor.fetchone()
            cursor.close()
            
            if not usuario:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
            return usuario
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener usuario: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/usuarios")
async def crear_usuario(usuario: UsuarioCreate):
    """Crea un nuevo usuario. Si el username ya existe, agrega la inicial del nombre automáticamente"""
    try:
        if not usuario.username or not usuario.username.strip():
            raise HTTPException(status_code=400, detail="El nombre de usuario no puede estar vacío")

        username_base = usuario.username.strip()
        username = username_base

        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

            cursor = conn.cursor()

            # Verificar si el usuario ya existe
            cursor.execute("SELECT id_usuario FROM usuarios WHERE username = %s", (username,))
            if cursor.fetchone():
                # El usuario ya existe, generar username con inicial del nombre
                if usuario.fullname:
                    # Obtener la primera letra del nombre completo
                    nombre_limpio = usuario.fullname.strip()
                    inicial = nombre_limpio[0].upper() if nombre_limpio else 'X'
                    
                    # Intentar con la inicial + username
                    username = f"{inicial}{username_base}"
                    cursor.execute("SELECT id_usuario FROM usuarios WHERE username = %s", (username,))
                    
                    if cursor.fetchone():
                        # Todavía existe, agregar número
                        contador = 1
                        while True:
                            username = f"{inicial}{username_base}{contador}"
                            cursor.execute("SELECT id_usuario FROM usuarios WHERE username = %s", (username,))
                            if not cursor.fetchone():
                                break
                            contador += 1
                            if contador > 100:  # Límite de seguridad
                                raise HTTPException(status_code=400, detail=f"No se pudo generar un username único para '{username_base}'")
                    
                    print(f"⚠️ Username '{username_base}' ya existía. Se usó: '{username}'")
                else:
                    # No hay nombre completo, intentar con números
                    contador = 1
                    while True:
                        username = f"{username_base}{contador}"
                        cursor.execute("SELECT id_usuario FROM usuarios WHERE username = %s", (username,))
                        if not cursor.fetchone():
                            print(f"⚠️ Username '{username_base}' ya existía. Se usó: '{username}'")
                            break
                        contador += 1
                        if contador > 100:  # Límite de seguridad
                            raise HTTPException(status_code=400, detail=f"No se pudo generar un username único para '{username_base}'")

            # Verificar que el rol existe
            cursor.execute("SELECT id_rol FROM roles WHERE id_rol = %s", (usuario.id_rol,))
            if not cursor.fetchone():
                raise HTTPException(status_code=400, detail="El rol especificado no existe")

            # Crear usuario con hash bcrypt (importado en db.py)
            import bcrypt
            password_hash = bcrypt.hashpw(usuario.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute("""
                INSERT INTO usuarios (username, fullname, password_hash, id_rol, id_departamento)
                VALUES (%s, %s, %s, %s, %s)
            """, (username, usuario.fullname, password_hash, usuario.id_rol, usuario.id_departamento))

            cursor.close()
            return {
                "message": "✅ Usuario creado exitosamente",
                "id_usuario": cursor.lastrowid,
                "username": username,
                "username_original": username_base,
                "username_modificado": username != username_base
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al crear usuario: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/usuarios/{id_usuario}")
async def actualizar_usuario(id_usuario: int, usuario: UsuarioUpdate):
    """Actualiza un usuario existente"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor()
            
            # Verificar que el usuario existe
            cursor.execute("SELECT id_usuario FROM usuarios WHERE id_usuario = %s", (id_usuario,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
            # Verificar que el rol existe si se está actualizando
            if usuario.id_rol:
                cursor.execute("SELECT id_rol FROM roles WHERE id_rol = %s", (usuario.id_rol,))
                if not cursor.fetchone():
                    raise HTTPException(status_code=400, detail="El rol especificado no existe")
            
            # Actualizar usuario
            updates = []
            values = []
            
            if usuario.fullname:
                updates.append("fullname = %s")
                values.append(usuario.fullname)
            if usuario.id_rol:
                updates.append("id_rol = %s")
                values.append(usuario.id_rol)
            if usuario.id_departamento is not None:
                updates.append("id_departamento = %s")
                values.append(usuario.id_departamento)
            
            if updates:
                values.append(id_usuario)
                cursor.execute(f"UPDATE usuarios SET {', '.join(updates)} WHERE id_usuario = %s", values)
            
            cursor.close()
            return {"message": "✅ Usuario actualizado exitosamente", "id_usuario": id_usuario}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al actualizar usuario: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/usuarios/{id_usuario}")
async def eliminar_usuario(id_usuario: int):
    """Elimina un usuario"""
    try:
        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
            
            cursor = conn.cursor()
            
            # Verificar que el usuario existe
            cursor.execute("SELECT id_usuario FROM usuarios WHERE id_usuario = %s", (id_usuario,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
            # Eliminar usuario
            cursor.execute("DELETE FROM usuarios WHERE id_usuario = %s", (id_usuario,))
            
            cursor.close()
            return {"message": "✅ Usuario eliminado exitosamente", "id_usuario": id_usuario}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al eliminar usuario: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/usuarios/{id_usuario}/cambiar-contrasena")
async def cambiar_contrasena(id_usuario: int, data: UsuarioChangePassword):
    """Cambia la contraseña de un usuario"""
    try:
        if len(data.password_nueva) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

        with DatabaseConnection() as conn:
            if not conn:
                raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")

            cursor = conn.cursor(dictionary=True)

            # Obtener usuario
            cursor.execute("SELECT password_hash FROM usuarios WHERE id_usuario = %s", (id_usuario,))
            usuario = cursor.fetchone()

            if not usuario:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            # Si se proporciona password_actual, verificarla (caso de usuario cambiando su propia contraseña)
            if data.password_actual is not None and data.password_actual != "":
                import bcrypt
                if not bcrypt.checkpw(data.password_actual.encode('utf-8'), usuario['password_hash'].encode('utf-8')):
                    raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

            # Actualizar contraseña con bcrypt
            import bcrypt
            hash_nueva = bcrypt.hashpw(data.password_nueva.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute("""
                UPDATE usuarios SET password_hash = %s WHERE id_usuario = %s
            """, (hash_nueva, id_usuario))

            cursor.close()
            return {"message": "✅ Contraseña actualizada exitosamente", "id_usuario": id_usuario}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al cambiar contraseña: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
