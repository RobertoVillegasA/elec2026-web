// frontend/src/pages/GestionRoles.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GestionRoles() {
  const navigate = useNavigate();
  const [delegados, setDelegados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  // Roles disponibles (solo 3)
  const rolesDisponibles = [
    { id: 4, nombre: 'Coordinador de Distrito' },
    { id: 5, nombre: 'Coordinador de Recinto' },
    { id: 6, nombre: 'Delegado' }
  ];

  // Cargar delegados al iniciar
  useEffect(() => {
    loadDelegados();
  }, []);

  const loadDelegados = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/delegados/listar');
      setDelegados(response.data || []);
    } catch (err) {
      console.error('Error al cargar delegados', err);
      setError('❌ Error al cargar delegados');
    } finally {
      setLoading(false);
    }
  };

  const handleCambioRol = async (idDelegado, nuevoRol) => {
    try {
      // Obtener datos actuales del delegado
      const delegado = delegados.find(d => d.id_delegado === idDelegado);
      if (!delegado) return;

      // Actualizar solo el rol
      const formData = {
        nombre: delegado.nombre,
        apellido: delegado.apellido,
        ci: delegado.ci,
        telefono: delegado.telefono || '',
        direccion: delegado.direccion || '',
        id_organizacion: delegado.id_organizacion,
        id_mesa: delegado.id_mesa,
        id_rol: nuevoRol,
        id_recinto: delegado.id_recinto,
        id_distrito: delegado.id_distrito
      };

      await api.put(`/api/delegados/${idDelegado}`, formData);
      
      setSuccess(`✅ Rol actualizado a ${rolesDisponibles.find(r => r.id === nuevoRol).nombre}`);
      loadDelegados();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al actualizar rol', err);
      setError(err.response?.data?.detail || '❌ Error al actualizar rol');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filtrar delegados
  const delegadosFiltrados = delegados.filter(del => {
    const coincideBusqueda = 
      del.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.ci.includes(searchTerm);
    
    const coincideRol = filtroRol ? del.id_rol == filtroRol : true;
    
    return coincideBusqueda && coincideRol;
  });

  const getRolNombre = (idRol) => {
    const rol = rolesDisponibles.find(r => r.id === idRol);
    return rol ? rol.nombre : 'Desconocido';
  };

  const getRolColor = (idRol) => {
    switch(idRol) {
      case 4: return 'bg-blue-100 text-blue-800 border-blue-300';
      case 5: return 'bg-green-100 text-green-800 border-green-300';
      case 6: return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🔄 Gestión de Roles</h1>
          <p className="text-gray-600 mt-1">Cambia el rol de delegados, coordinadores de distrito y recinto</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
        >
          ↩️ Volver al Dashboard
        </button>
      </div>

      {/* Mensajes */}
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border border-red-200">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 border border-green-200">{success}</div>}

      {/* Panel de Filtros */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">🔍 Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, apellido o CI..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por rol</label>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los roles</option>
              {rolesDisponibles.map(rol => (
                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen */}
        <div className="mt-4 flex gap-4">
          <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">Total delegados:</p>
            <p className="text-2xl font-bold text-blue-900">{delegados.length}</p>
          </div>
          <div className="flex-1 bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">Filtrados:</p>
            <p className="text-2xl font-bold text-green-900">{delegadosFiltrados.length}</p>
          </div>
        </div>
      </div>

      {/* Tabla de Delegados */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">📋 Lista de Delegados</h2>
          <p className="text-sm text-gray-600 mt-1">
            Selecciona un nuevo rol para cambiar el rol del delegado
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4">Cargando delegados...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">CI</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Teléfono</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Rol Actual</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">Cambiar a:</th>
                </tr>
              </thead>
              <tbody>
                {delegadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No se encontraron delegados
                    </td>
                  </tr>
                ) : (
                  delegadosFiltrados.map((del) => (
                    <tr key={del.id_delegado} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{del.nombre} {del.apellido}</p>
                        {del.recinto && (
                          <p className="text-xs text-gray-500">📍 {del.recinto}</p>
                        )}
                        {del.nro_distrito && (
                          <p className="text-xs text-gray-500">🗺️ Distrito {del.nro_distrito}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-gray-600">{del.ci}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{del.telefono || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRolColor(del.id_rol)}`}>
                          {getRolNombre(del.id_rol)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={del.id_rol}
                          onChange={(e) => handleCambioRol(del.id_delegado, parseInt(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          {rolesDisponibles.map(rol => (
                            <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ Información importante:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• El nombre de usuario se genera automáticamente: <strong>CI + inicial del nombre</strong></li>
          <li>• Al cambiar el rol, se actualiza automáticamente en la tabla de usuarios</li>
          <li>• La contraseña por defecto es igual al nombre de usuario</li>
          <li>• Solo están disponibles los roles: Coordinador de Distrito, Coordinador de Recinto y Delegado</li>
        </ul>
      </div>

      {/* Botón Volver al Dashboard */}
      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 mx-auto"
        >
          <span>↩️</span>
          <span>Volver al Dashboard</span>
        </button>
      </div>
    </div>
  );
}
