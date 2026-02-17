// frontend/src/pages/GestionCordRecinto.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GestionCordRecinto() {
  const navigate = useNavigate();
  const [coordinadores, setCoordinadores] = useState([]);
  const [recintos, setRecintos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para el formulario
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    ci: '',
    telefono: '',
    direccion: '',
    id_recinto: ''
  });

  // Estados para confirmación de eliminación
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Estado para búsqueda de recintos
  const [searchRecinto, setSearchRecinto] = useState('');

  // Cargar coordinadores y recintos al iniciar
  useEffect(() => {
    loadCoordinadores();
    loadRecintos();
  }, []);

  const loadCoordinadores = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/cord_recinto'); // Asumiendo que crearás este endpoint
      setCoordinadores(response.data || []);
    } catch (err) {
      console.error('Error al cargar coordinadores de recinto', err);
      setError('❌ Error al cargar los coordinadores de recinto');
    } finally {
      setLoading(false);
    }
  };

  const loadRecintos = async () => {
    try {
      const response = await api.get('/api/catalog?table=recintos');
      setRecintos(response.data || {});
    } catch (err) {
      console.error('Error al cargar recintos', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('❌ El nombre es obligatorio');
      return false;
    }
    if (!formData.apellido.trim()) {
      setError('❌ El apellido es obligatorio');
      return false;
    }
    if (!formData.ci.trim()) {
      setError('❌ El CI es obligatorio');
      return false;
    }
    if (!formData.id_recinto) {
      setError('❌ El recinto es obligatorio');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingId) {
        // Actualizar coordinador existente
        await api.put(`/api/cord_recinto/${editingId}`, formData);
        setSuccess('✅ Coordinador actualizado exitosamente');
      } else {
        // Crear nuevo coordinador
        await api.post('/api/cord_recinto', formData);
        
        // Crear usuario automáticamente para el coordinador de recinto
        const nombreInicial = formData.nombre.charAt(0).toLowerCase();
        const username = formData.ci;
        const password = formData.ci + nombreInicial;
        
        // Buscar el ID del rol "Coordinador Recinto"
        const rolesResponse = await api.get('/api/roles');
        const rolCoordRecinto = rolesResponse.data.find(rol => 
          rol.nombre_rol.toLowerCase().includes('recinto') || 
          rol.nombre_rol.toLowerCase().includes('cord_recinto')
        );
        
        if (rolCoordRecinto) {
          const userData = {
            username: username,
            fullname: `${formData.nombre} ${formData.apellido}`,
            password: password,
            id_rol: rolCoordRecinto.id_rol,
            id_departamento: null
          };
          
          try {
            await api.post('/api/usuarios', userData);
            setSuccess(`✅ Coordinador creado exitosamente. Usuario generado: ${username}, Contraseña: ${password}`);
          } catch (userErr) {
            console.error('Error al crear usuario para coordinador', userErr);
            setSuccess('✅ Coordinador creado exitosamente, pero ocurrió un error al crear el usuario.');
          }
        } else {
          setSuccess('✅ Coordinador creado exitosamente, pero no se encontró el rol de coordinador de recinto.');
        }
      }

      // Limpiar formulario y recargar datos
      setFormData({
        nombre: '',
        apellido: '',
        ci: '',
        telefono: '',
        direccion: '',
        id_recinto: ''
      });
      setShowForm(false);
      setEditingId(null);

      // Recargar la lista después de un breve tiempo
      setTimeout(() => {
        loadCoordinadores();
      }, 1000);
    } catch (err) {
      console.error('Error al guardar coordinador', err);
      setError(err.response?.data?.detail || '❌ Error al guardar el coordinador');
    }
  };

  const handleEdit = (coordinador) => {
    setFormData({
      nombre: coordinador.nombre || '',
      apellido: coordinador.apellido || '',
      ci: coordinador.ci || '',
      telefono: coordinador.telefono || '',
      direccion: coordinador.direccion || '',
      id_recinto: coordinador.id_recinto || ''
    });
    setEditingId(coordinador.id_cord_recinto);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async (id) => {
    try {
      // Primero obtener los datos del coordinador para obtener su CI (que es el username del usuario)
      const coordResponse = await api.get(`/api/cord_recinto/${id}`);
      const coordinador = coordResponse.data;
      const ciCoordinador = coordinador.ci;

      // Eliminar el coordinador de recinto
      await api.delete(`/api/cord_recinto/${id}`);

      // Buscar y eliminar el usuario correspondiente
      try {
        // Buscar el usuario por su username (que es el CI del coordinador)
        const usuariosResponse = await api.get('/api/usuarios');
        const usuarioAEliminar = usuariosResponse.data.find(usuario => usuario.username === ciCoordinador);

        if (usuarioAEliminar) {
          await api.delete(`/api/usuarios/${usuarioAEliminar.id_usuario}`);
          setSuccess('✅ Coordinador y usuario eliminados exitosamente');
        } else {
          setSuccess('✅ Coordinador eliminado exitosamente, pero no se encontró un usuario asociado.');
        }
      } catch (userErr) {
        console.error('Error al eliminar usuario del coordinador', userErr);
        setSuccess('✅ Coordinador eliminado exitosamente, pero ocurrió un error al eliminar el usuario asociado.');
      }

      setDeleteConfirm(null);
      // Recargar la lista después de un breve tiempo
      setTimeout(() => {
        loadCoordinadores();
      }, 1000);
    } catch (err) {
      console.error('Error al eliminar coordinador', err);
      setError(err.response?.data?.detail || '❌ Error al eliminar el coordinador');
      setDeleteConfirm(null);
    }
  };

  const handleNew = () => {
    setFormData({
      nombre: '',
      apellido: '',
      ci: '',
      telefono: '',
      direccion: '',
      id_recinto: ''
    });
    setEditingId(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">⏳ Cargando coordinadores de recinto...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">🏢 Gestión de Coordinadores de Recinto</h1>
        <button
          onClick={handleNew}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
        >
          + Nuevo Coordinador
        </button>
      </div>

      {/* Mensajes de error y éxito */}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 border border-green-200">{success}</div>}

      {/* Formulario de creación/edición */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            {editingId ? 'Editar Coordinador' : 'Nuevo Coordinador'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ingrese el nombre"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Apellido *</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ingrese el apellido"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">CI *</label>
                <input
                  type="text"
                  name="ci"
                  value={formData.ci}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ingrese el CI"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ingrese el teléfono"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Recinto *</label>
                <input
                  type="text"
                  placeholder="Buscar recinto..."
                  value={searchRecinto}
                  onChange={(e) => setSearchRecinto(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
                />
                <select
                  name="id_recinto"
                  value={formData.id_recinto}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccione un recinto</option>
                  {Object.entries(recintos)
                    .filter(([nombre, id]) => 
                      nombre.toLowerCase().includes(searchRecinto.toLowerCase())
                    )
                    .map(([nombre, id]) => (
                      <option key={id} value={id}>{nombre}</option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ingrese la dirección"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de coordinadores */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="text-sm text-gray-600 mb-4">
          Mostrando <strong>{coordinadores.length}</strong> coordinadores de recinto
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">ID</th>
                <th className="py-3 px-4 text-left font-semibold">Nombre</th>
                <th className="py-3 px-4 text-left font-semibold">Apellido</th>
                <th className="py-3 px-4 text-left font-semibold">CI</th>
                <th className="py-3 px-4 text-left font-semibold">Teléfono</th>
                <th className="py-3 px-4 text-left font-semibold">Recinto</th>
                <th className="py-3 px-4 text-left font-semibold">Dirección</th>
                <th className="py-3 px-4 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coordinadores.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-gray-500">
                    📭 No se encontraron coordinadores de recinto
                  </td>
                </tr>
              ) : (
                coordinadores.map((coord) => (
                  <tr key={coord.id_cord_recinto} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{coord.id_cord_recinto}</td>
                    <td className="py-3 px-4">{coord.nombre}</td>
                    <td className="py-3 px-4">{coord.apellido}</td>
                    <td className="py-3 px-4 font-mono">{coord.ci}</td>
                    <td className="py-3 px-4">{coord.telefono || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {coord.nombre_recinto || 'Recinto #' + coord.id_recinto}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-sm" title={coord.direccion || ''}>
                      {coord.direccion || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleEdit(coord)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm mr-2"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(coord.id_cord_recinto)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación de eliminar */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-4">⚠️ Confirmar Eliminación</h3>
            <p className="text-gray-700 mb-6">
              ¿Está seguro de que desea eliminar este coordinador de recinto? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
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