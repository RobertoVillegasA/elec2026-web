// frontend/src/pages/GestionUsuarios.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios' o 'roles'
  
  // USUARIOS
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [searchUsuarios, setSearchUsuarios] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editFormUser, setEditFormUser] = useState({});
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    fullname: '',
    password: '',
    id_rol: '',
    id_departamento: ''
  });
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  
  // ROLES
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [searchRoles, setSearchRoles] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [editFormRole, setEditFormRole] = useState({});
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    nombre_rol: ''
  });
  const [deleteConfirmRole, setDeleteConfirmRole] = useState(null);
  
  // GENERAL
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [departamentos, setDepartamentos] = useState([]);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resUsuarios, resRoles, resDepartamentos] = await Promise.all([
        api.get('/api/usuarios'),
        api.get('/api/roles'),
        api.get('/api/catalog?table=departamentos')
      ]);
      setUsuarios(resUsuarios.data || []);
      setFilteredUsuarios(resUsuarios.data || []);
      setRoles(resRoles.data || []);
      setFilteredRoles(resRoles.data || []);
      setDepartamentos(resDepartamentos.data || {});
    } catch (err) {
      console.error('Error al cargar datos', err);
      setError('❌ Error al cargar usuarios, roles y departamentos');
    } finally {
      setLoading(false);
    }
  };

  // ========== USUARIOS ==========

  useEffect(() => {
    let result = usuarios;
    if (searchUsuarios) {
      result = result.filter(u => 
        u.username?.toLowerCase().includes(searchUsuarios.toLowerCase()) ||
        u.fullname?.toLowerCase().includes(searchUsuarios.toLowerCase())
      );
    }
    setFilteredUsuarios(result);
  }, [searchUsuarios, usuarios]);


  const handleEditUser = (usuario) => {
    setEditingUser(usuario.id_usuario);
    setEditFormUser({
      fullname: usuario.fullname || '',
      id_rol: usuario.id_rol || '',
      id_departamento: usuario.id_departamento || '',  // Initialize with empty string instead of null
      showChangePassword: false  // Initialize showChangePassword in editFormUser
    });
    setError('');
    setSuccess('');
  };

  const handleSaveEditUser = async (id_usuario) => {
    try {
      setError('');
      if (!editFormUser.fullname?.trim()) {
        setError('❌ El nombre completo es obligatorio');
        return;
      }
      if (!editFormUser.id_rol) {
        setError('❌ Debe seleccionar un rol');
        return;
      }

      // Prepare the update object, ensuring we handle optional id_departamento properly
      const updateData = {
        fullname: editFormUser.fullname,
        id_rol: editFormUser.id_rol
      };
      
      // Only include id_departamento if it's provided (not empty string)
      if (editFormUser.id_departamento !== '' && editFormUser.id_departamento !== null && editFormUser.id_departamento !== undefined) {
        updateData.id_departamento = parseInt(editFormUser.id_departamento);
      } else {
        // If empty, set to null to clear the department
        updateData.id_departamento = null;
      }

      await api.put(`/api/usuarios/${id_usuario}`, updateData);
      let successMessage = '✅ Usuario actualizado exitosamente';
      
      // If password change is requested, handle it separately
      if (editFormUser.newPassword && editFormUser.newPassword.length >= 6) {
        try {
          await api.post(`/api/usuarios/${id_usuario}/cambiar-contrasena`, {
            password_actual: null, // Null since admin is changing it
            password_nueva: editFormUser.newPassword
          });
          successMessage = '✅ Usuario y contraseña actualizados exitosamente';
        } catch (pwdErr) {
          console.error('Error cambiando contraseña', pwdErr);
          // Still show success for user update, but log the password error
        }
      }
      
      setSuccess(successMessage);
      
      setTimeout(() => {
        // Solo recargar la lista de usuarios, no reiniciar el estado de edición
        const loadUsuarios = async () => {
          try {
            const res = await api.get('/api/usuarios');
            setUsuarios(res.data || []);
            setFilteredUsuarios(res.data || []);
          } catch (err) {
            console.error('Error al cargar usuarios', err);
          }
        };
        loadUsuarios();
        setEditingUser(null);
      }, 1000);
    } catch (err) {
      console.error('Error', err);
      setError(err.response?.data?.detail || '❌ Error al actualizar usuario');
    }
  };

  const handleChangePasswordToggle = (userId) => {
    // Usar un identificador para saber qué usuario está siendo editado
    // Solo actualizar si el usuario actual coincide con el que está siendo editado
    setEditFormUser(prevForm => {
      // Solo proceder si estamos editando el usuario correcto
      const newFormState = { ...prevForm };
      // Agregar una propiedad temporal para indicar que se está mostrando el formulario de cambio de contraseña
      newFormState.showChangePassword = !prevForm.showChangePassword;
      
      // Reset password fields when closing the password form
      if (prevForm.showChangePassword) {
        delete newFormState.newPassword;
        delete newFormState.confirmNewPassword;
      }
      
      return newFormState;
    });
  };

  const handleChangePasswordSubmit = async (id_usuario) => {
    try {
      setError('');
      
      if (!editFormUser.newPassword || editFormUser.newPassword.length < 6) {
        setError('❌ La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }
      
      if (editFormUser.newPassword !== editFormUser.confirmNewPassword) {
        setError('❌ Las contraseñas nuevas no coinciden');
        return;
      }

      await api.post(`/api/usuarios/${id_usuario}/cambiar-contrasena`, {
        password_actual: null, // Null since admin is changing it
        password_nueva: editFormUser.newPassword
      });
      
      setSuccess('✅ Contraseña actualizada exitosamente');
      setTimeout(() => {
        // Solo recargar la lista de usuarios, no reiniciar el estado de edición
        const loadUsuarios = async () => {
          try {
            const res = await api.get('/api/usuarios');
            setUsuarios(res.data || []);
            setFilteredUsuarios(res.data || []);
          } catch (err) {
            console.error('Error al cargar usuarios', err);
          }
        };
        loadUsuarios();
        // Cerrar solo el formulario de cambio de contraseña, no la edición completa
        setEditFormUser(prevForm => {
          const newFormState = { ...prevForm };
          newFormState.showChangePassword = false;
          delete newFormState.newPassword;
          delete newFormState.confirmNewPassword;
          return newFormState;
        });
      }, 1000);
    } catch (err) {
      console.error('Error', err);
      setError(err.response?.data?.detail || '❌ Error al cambiar contraseña');
    }
  };

  const handleCreateUser = async () => {
    try {
      setError('');
      if (!newUserForm.username?.trim()) {
        setError('❌ El nombre de usuario es obligatorio');
        return;
      }
      if (!newUserForm.fullname?.trim()) {
        setError('❌ El nombre completo es obligatorio');
        return;
      }
      if (!newUserForm.password?.trim() || newUserForm.password.length < 6) {
        setError('❌ La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (!newUserForm.id_rol) {
        setError('❌ Debe seleccionar un rol');
        return;
      }

      // Prepare the user data, handling optional id_departamento
      const userData = {
        username: newUserForm.username.trim(),
        fullname: newUserForm.fullname.trim(),
        password: newUserForm.password,
        id_rol: parseInt(newUserForm.id_rol)
      };

      // Only include id_departamento if it's provided and not empty
      if (newUserForm.id_departamento !== '' && newUserForm.id_departamento !== null && newUserForm.id_departamento !== undefined) {
        userData.id_departamento = parseInt(newUserForm.id_departamento);
      }

      await api.post('/api/usuarios', userData);
      setSuccess('✅ Usuario creado exitosamente');
      setTimeout(() => {
        // Solo recargar la lista de usuarios, no todos los datos
        const loadUsuarios = async () => {
          try {
            const res = await api.get('/api/usuarios');
            setUsuarios(res.data || []);
            setFilteredUsuarios(res.data || []);
          } catch (err) {
            console.error('Error al cargar usuarios', err);
          }
        };
        loadUsuarios();
        setShowNewUserForm(false);
        setNewUserForm({
          username: '',
          fullname: '',
          password: '',
          id_rol: '',
          id_departamento: ''  // Add this field to reset form properly
        });
      }, 1000);
    } catch (err) {
      console.error('Error', err);
      setError(err.response?.data?.detail || '❌ Error al crear usuario');
    }
  };

  const handleDeleteUser = async (id_usuario) => {
    try {
      setError('');
      await api.delete(`/api/usuarios/${id_usuario}`);
      setSuccess('✅ Usuario eliminado exitosamente');
      setTimeout(() => {
        // Solo recargar la lista de usuarios, no todos los datos
        const loadUsuarios = async () => {
          try {
            const res = await api.get('/api/usuarios');
            setUsuarios(res.data || []);
            setFilteredUsuarios(res.data || []);
          } catch (err) {
            console.error('Error al cargar usuarios', err);
          }
        };
        loadUsuarios();
        setDeleteConfirmUser(null);
      }, 1000);
    } catch (err) {
      console.error('Error', err);
      setError(err.response?.data?.detail || '❌ Error al eliminar usuario');
      setDeleteConfirmUser(null);
    }
  };

  // ========== ROLES ==========

  useEffect(() => {
    let result = roles;
    if (searchRoles) {
      result = result.filter(r => 
        r.nombre_rol?.toLowerCase().includes(searchRoles.toLowerCase())
      );
    }
    setFilteredRoles(result);
  }, [searchRoles, roles]);

  const handleEditRole = (rol) => {
    setEditingRole(rol.id_rol);
    setEditFormRole({
      nombre_rol: rol.nombre_rol || ''
    });
    setError('');
    setSuccess('');
  };

  const handleSaveEditRole = async (id_rol) => {
    try {
      setError('');
      if (!editFormRole.nombre_rol?.trim()) {
        setError('❌ El nombre del rol es obligatorio');
        return;
      }

      await api.put(`/api/roles/${id_rol}`, { nombre_rol: editFormRole.nombre_rol.trim() });
      setSuccess('✅ Rol actualizado exitosamente');
      setTimeout(() => {
        // Solo recargar la lista de roles, no todos los datos
        const loadRoles = async () => {
          try {
            const res = await api.get('/api/roles');
            setRoles(res.data || []);
            setFilteredRoles(res.data || []);
          } catch (err) {
            console.error('Error al cargar roles', err);
          }
        };
        loadRoles();
        setEditingRole(null);
      }, 1000);
    } catch (err) {
      console.error('Error', err);
      setError(err.response?.data?.detail || '❌ Error al actualizar rol');
    }
  };

  const handleCreateRole = async () => {
    try {
      setError('');
      if (!newRoleForm.nombre_rol?.trim()) {
        setError('❌ El nombre del rol es obligatorio');
        return;
      }

      await api.post('/api/roles', newRoleForm);
      setSuccess('✅ Rol creado exitosamente');
      setTimeout(() => {
        // Solo recargar la lista de roles, no todos los datos
        const loadRoles = async () => {
          try {
            const res = await api.get('/api/roles');
            setRoles(res.data || []);
            setFilteredRoles(res.data || []);
          } catch (err) {
            console.error('Error al cargar roles', err);
          }
        };
        loadRoles();
        setShowNewRoleForm(false);
        setNewRoleForm({ nombre_rol: '' });
      }, 1000);
    } catch (err) {
      console.error('Error', err);
      setError(err.response?.data?.detail || '❌ Error al crear rol');
    }
  };

  const handleDeleteRole = async (id_rol) => {
    try {
      setError('');
      await api.delete(`/api/roles/${id_rol}`);
      setSuccess('✅ Rol eliminado exitosamente');
      setTimeout(() => {
        // Solo recargar la lista de roles, no todos los datos
        const loadRoles = async () => {
          try {
            const res = await api.get('/api/roles');
            setRoles(res.data || []);
            setFilteredRoles(res.data || []);
          } catch (err) {
            console.error('Error al cargar roles', err);
          }
        };
        loadRoles();
        setDeleteConfirmRole(null);
      }, 1000);
    } catch (err) {
      console.error('Error', err);
      setError(err.response?.data?.detail || '❌ Error al eliminar rol');
      setDeleteConfirmRole(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">⏳ Cargando...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">👥 Gestión de Usuarios y Roles</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ← Volver
        </button>
      </div>

      {/* Mensajes */}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 border border-green-200">{success}</div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'usuarios'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          👤 Usuarios ({filteredUsuarios.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'roles'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔐 Roles ({filteredRoles.length})
        </button>
      </div>

      {/* ========== TAB USUARIOS ========== */}
      {activeTab === 'usuarios' && (
        <div>
          {/* Búsqueda y botón crear */}
          <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
            <div className="flex justify-between items-center gap-4 mb-4">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre o usuario..."
                value={searchUsuarios}
                onChange={e => setSearchUsuarios(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setShowNewUserForm(!showNewUserForm)}
                className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium whitespace-nowrap"
              >
                + Nuevo Usuario
              </button>
            </div>

            {/* Formulario crear usuario */}
            {showNewUserForm && (
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 mb-4">
                <h3 className="font-semibold mb-4">Crear Nuevo Usuario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre de usuario"
                    value={newUserForm.username}
                    onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={newUserForm.fullname}
                    onChange={e => setNewUserForm({ ...newUserForm, fullname: e.target.value })}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={newUserForm.password}
                    onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <select
                    value={newUserForm.id_rol}
                    onChange={e => setNewUserForm({ ...newUserForm, id_rol: parseInt(e.target.value) || '' })}
                    className="p-2 border border-gray-300 rounded"
                  >
                    <option value="">Seleccionar rol...</option>
                    {roles.map(r => (
                      <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                    ))}
                  </select>
                  <select
                    value={newUserForm.id_departamento}
                    onChange={e => setNewUserForm({ ...newUserForm, id_departamento: e.target.value || '' })}
                    className="p-2 border border-gray-300 rounded"
                  >
                    <option value="">Departamento (opcional)</option>
                    {Object.entries(departamentos).map(([nombre, id]) => (
                      <option key={id} value={id}>{nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleCreateUser}
                    className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    ✓ Crear
                  </button>
                  <button
                    onClick={() => setShowNewUserForm(false)}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tabla usuarios */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left">Usuario</th>
                  <th className="py-3 px-4 text-left">Nombre Completo</th>
                  <th className="py-3 px-4 text-left">Rol</th>
                  <th className="py-3 px-4 text-left">Departamento</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-500">
                      📭 No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <React.Fragment key={usuario.id_usuario}>
                      {editingUser === usuario.id_usuario ? (
                        <tr className="bg-blue-50 border-b-2 border-blue-200">
                          <td className="py-3 px-4">{usuario.username}</td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editFormUser.fullname}
                              onChange={e => setEditFormUser({ ...editFormUser, fullname: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={editFormUser.id_rol}
                              onChange={e => setEditFormUser({ ...editFormUser, id_rol: parseInt(e.target.value) || '' })}
                              className="w-full p-2 border border-gray-300 rounded"
                            >
                              {roles.map(r => (
                                <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={editFormUser.id_departamento || ''}
                              onChange={e => setEditFormUser({ ...editFormUser, id_departamento: e.target.value || null })}
                              className="w-full p-2 border border-gray-300 rounded"
                            >
                              <option value="">Departamento (opcional)</option>
                              {Object.entries(departamentos).map(([nombre, id]) => (
                                <option key={id} value={id}>{nombre}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col space-y-2">
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleSaveEditUser(usuario.id_usuario)}
                                  className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                  title="Guardar cambios"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingUser(null)}
                                  className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click event
                                  handleChangePasswordToggle(usuario.id_usuario);
                                }}
                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                title="Cambiar contraseña"
                              >
                                🔑
                              </button>
                            </div>
                            
                            {/* Formulario para cambiar contraseña */}
                            {editingUser === usuario.id_usuario && editFormUser.showChangePassword && (
                              <div className="mt-2 p-2 bg-blue-100 rounded border border-blue-200">
                                <div className="mb-2">
                                  <input
                                    type="password"
                                    placeholder="Nueva contraseña"
                                    value={editFormUser.newPassword || ''}
                                    onChange={e => setEditFormUser({ ...editFormUser, newPassword: e.target.value })}
                                    className="w-full p-1 text-xs border border-gray-300 rounded mb-1"
                                  />
                                  <input
                                    type="password"
                                    placeholder="Confirmar nueva contraseña"
                                    value={editFormUser.confirmNewPassword || ''}
                                    onChange={e => setEditFormUser({ ...editFormUser, confirmNewPassword: e.target.value })}
                                    className="w-full p-1 text-xs border border-gray-300 rounded"
                                  />
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleChangePasswordSubmit(usuario.id_usuario)}
                                    className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs"
                                  >
                                    ✓ Cambiar
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent row click event
                                      handleChangePasswordToggle(usuario.id_usuario);
                                    }}
                                    className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        <tr className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-blue-600">{usuario.username}</td>
                          <td className="py-3 px-4">{usuario.fullname}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {usuario.nombre_rol}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {usuario.id_departamento ? 
                              (Object.keys(departamentos).find(key => String(departamentos[key]) === String(usuario.id_departamento)) || `Dept. ${usuario.id_departamento}`)
                              : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleEditUser(usuario)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm mr-2"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setDeleteConfirmUser(usuario.id_usuario)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== TAB ROLES ========== */}
      {activeTab === 'roles' && (
        <div>
          {/* Búsqueda y botón crear */}
          <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
            <div className="flex justify-between items-center gap-4 mb-4">
              <input
                type="text"
                placeholder="🔍 Buscar rol..."
                value={searchRoles}
                onChange={e => setSearchRoles(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setShowNewRoleForm(!showNewRoleForm)}
                className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium whitespace-nowrap"
              >
                + Nuevo Rol
              </button>
            </div>

            {/* Formulario crear rol */}
            {showNewRoleForm && (
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 mb-4">
                <h3 className="font-semibold mb-4">Crear Nuevo Rol</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre del rol"
                    value={newRoleForm.nombre_rol}
                    onChange={e => setNewRoleForm({ ...newRoleForm, nombre_rol: e.target.value })}
                    className="p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleCreateRole}
                    className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    ✓ Crear
                  </button>
                  <button
                    onClick={() => setShowNewRoleForm(false)}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tabla roles */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left">Nombre</th>
                  <th className="py-3 px-4 text-left">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-6 text-gray-500">
                      📭 No se encontraron roles
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((rol) => (
                    <React.Fragment key={rol.id_rol}>
                      {editingRole === rol.id_rol ? (
                        <tr className="bg-blue-50 border-b-2 border-blue-200">
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editFormRole.nombre_rol}
                              onChange={e => setEditFormRole({ ...editFormRole, nombre_rol: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              Activo
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleSaveEditRole(rol.id_rol)}
                              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingRole(null)}
                              className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold">{rol.nombre_rol}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              ✓ Activo
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleEditRole(rol)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm mr-2"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setDeleteConfirmRole(rol.id_rol)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar usuario */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-4">⚠️ Confirmar Eliminación</h3>
            <p className="text-gray-700 mb-6">¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUser)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar rol */}
      {deleteConfirmRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-4">⚠️ Confirmar Eliminación</h3>
            <p className="text-gray-700 mb-6">¿Está seguro de eliminar este rol? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirmRole(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteRole(deleteConfirmRole)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
