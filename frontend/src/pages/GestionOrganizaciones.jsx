// frontend/src/pages/GestionOrganizaciones.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GestionOrganizaciones() {
  const navigate = useNavigate();

  // Estados
  const [organizaciones, setOrganizaciones] = useState([]);
  const [filteredOrganizaciones, setFilteredOrganizaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Estados de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    sigla: ''
  });

  // Cargar organizaciones inicialmente
  useEffect(() => {
    loadOrganizaciones();
  }, []);

  // Filtrar cuando cambia searchTerm
  useEffect(() => {
    let filtered = organizaciones;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(org =>
        org.nombre.toLowerCase().includes(term) ||
        org.sigla.toLowerCase().includes(term)
      );
    }
    setFilteredOrganizaciones(filtered);
  }, [searchTerm, organizaciones]);

  // Cargar lista de organizaciones
  const loadOrganizaciones = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/organizaciones');
      setOrganizaciones(res.data || []);
      setFilteredOrganizaciones(res.data || []);
    } catch (err) {
      console.error('Error al cargar organizaciones', err);
      setError('❌ Error al cargar organizaciones: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Enviar formulario (crear o editar)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.sigla.trim()) {
      setError('❌ Por favor completa los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/api/organizaciones/${editingId}`, formData);
        setError('');
        alert('✅ Organización actualizada exitosamente');
        setIsEditing(false);
        setEditingId(null);
      } else {
        await api.post('/api/organizaciones', formData);
        setError('');
        alert('✅ Organización registrada exitosamente');
      }

      setFormData({
        nombre: '',
        sigla: ''
      });
      loadOrganizaciones();
    } catch (err) {
      console.error('Error', err);
      setError('❌ Error: ' + (err.response?.data?.detail || 'Algo salió mal'));
    } finally {
      setLoading(false);
    }
  };

  // Editar organización
  const handleEdit = (org) => {
    setIsEditing(true);
    setEditingId(org.id_organizacion);
    setFormData({
      nombre: org.nombre,
      sigla: org.sigla
    });
    window.scrollTo(0, 0);
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      nombre: '',
      sigla: ''
    });
  };

  // Eliminar organización
  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`)) {
      setLoading(true);
      try {
        await api.delete(`/api/organizaciones/${id}`);
        alert('✅ Organización eliminada exitosamente');
        loadOrganizaciones();
      } catch (err) {
        console.error('Error', err);
        setError('❌ Error al eliminar: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
            title="Volver atrás"
          >
            ← Volver
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Organizaciones Políticas</h1>
            <p className="text-gray-600">Administra las organizaciones políticas del sistema</p>
          </div>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* ============ FORMULARIO CREAR/EDITAR ============ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {isEditing ? 'Editar Organización' : 'Registrar Nueva Organización'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <input
              type="text"
              name="nombre"
              placeholder="Nombre completo"
              value={formData.nombre}
              onChange={handleInputChange}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />

            {/* Sigla */}
            <input
              type="text"
              name="sigla"
              placeholder="Sigla (ej: MAS, CC, UN)"
              value={formData.sigla}
              onChange={handleInputChange}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
              required
              maxLength="10"
            />

            {/* Botones */}
            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Procesando...' : isEditing ? 'Actualizar' : 'Registrar'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ============ BÚSQUEDA ============ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o sigla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ============ TABLA DE ORGANIZACIONES ============ */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-800">
              Organizaciones Registradas ({filteredOrganizaciones.length})
            </h2>
          </div>

          {loading && <div className="p-4 text-center text-gray-600">Cargando...</div>}

          {!loading && filteredOrganizaciones.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              {organizaciones.length === 0
                ? 'No hay organizaciones registradas'
                : 'No se encontraron resultados'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Nombre</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Sigla</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizaciones.map((org) => (
                    <tr key={org.id_organizacion} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {org.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">
                        {org.sigla}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleEdit(org)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded mr-2"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(org.id_organizacion, org.nombre)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
    </div>
  );
}
