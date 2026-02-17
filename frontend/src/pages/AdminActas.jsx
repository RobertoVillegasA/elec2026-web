// frontend/src/pages/AdminActas.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AdminActas() {
  const navigate = useNavigate();
  const [actas, setActas] = useState([]);
  const [filteredActas, setFilteredActas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedActa, setExpandedActa] = useState(null);
  const [filters, setFilters] = useState({
    mesa: '',
    recinto: '',
    municipio: '',
    provincia: '',
    departamento: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar actas al iniciar
  useEffect(() => {
    loadActas();
  }, []);

  const loadActas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/actas');
      setActas(res.data || []);
      setFilteredActas(res.data || []);
    } catch (err) {
      console.error('Error al cargar actas', err);
      setError('❌ Error al cargar las actas registradas');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros y búsqueda
  useEffect(() => {
    let result = actas;

    // Búsqueda por código de acta
    if (searchTerm) {
      result = result.filter(a =>
        a.codigo_acta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id_acta?.toString().includes(searchTerm)
      );
    }

    // Filtros adicionales
    if (filters.mesa) {
      result = result.filter(a =>
        a.id_mesa?.toString().includes(filters.mesa)
      );
    }
    if (filters.recinto) {
      result = result.filter(a =>
        a.nombre_recinto?.toLowerCase().includes(filters.recinto.toLowerCase())
      );
    }
    if (filters.municipio) {
      result = result.filter(a =>
        a.nombre_municipio?.toLowerCase().includes(filters.municipio.toLowerCase())
      );
    }
    if (filters.provincia) {
      result = result.filter(a =>
        a.nombre_provincia?.toLowerCase().includes(filters.provincia.toLowerCase())
      );
    }
    if (filters.departamento) {
      result = result.filter(a =>
        a.nombre_departamento?.toLowerCase().includes(filters.departamento.toLowerCase())
      );
    }

    setFilteredActas(result);
  }, [filters, actas, searchTerm]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({ mesa: '', recinto: '', municipio: '', provincia: '', departamento: '' });
    setSearchTerm('');
  };

  const [imagenesActa, setImagenesActa] = useState([]);
  const [imagenesHojaTrabajo, setImagenesHojaTrabajo] = useState([]);
  const [votosDetalle, setVotosDetalle] = useState([]);
  const [modalActa, setModalActa] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleEdit = async (acta) => {
    try {
      setEditingId(acta.id_acta);
      
      // Set the main acta data
      setEditForm({
        codigo_acta: acta.codigo_acta || '',
        total_actas: acta.total_actas || 0,
        votos_blancos_g: acta.votos_blancos_g || 0,
        votos_nulos_g: acta.votos_nulos_g || 0,
        votos_blancos_p: acta.votos_blancos_p || 0,
        votos_nulos_p: acta.votos_nulos_p || 0,
        votos_blancos_t: acta.votos_blancos_t || 0,
        votos_nulos_t: acta.votos_nulos_t || 0,
        votos_blancos_a: acta.votos_blancos_a || 0,
        votos_nulos_a: acta.votos_nulos_a || 0,
        votos_blancos_c: acta.votos_blancos_c || 0,
        votos_nulos_c: acta.votos_nulos_c || 0,
        observaciones: acta.observaciones || '',
        tipo_papeleta: acta.tipo_papeleta || ''
      });

      // Fetch voting details for this acta
      try {
        const votosRes = await api.get(`/api/votos_detalle/acta/${acta.id_acta}`);
        setVotosDetalle(votosRes.data || []);
      } catch (votosErr) {
        console.error('Error al cargar votos detalle:', votosErr);
        setVotosDetalle([]);
      }

      // Fetch images for this acta from f_acta table
      try {
        const imgActaRes = await api.get(`/api/fotos_acta/acta/${acta.id_acta}`);
        setImagenesActa(imgActaRes.data || []);
      } catch (imgActaErr) {
        console.error('Error al cargar imágenes de acta:', imgActaErr);
        setImagenesActa([]);
      }

      // Fetch images for this acta's hoja de trabajo from f_h_trabajo table
      try {
        const imgHTrabRes = await api.get(`/api/fotos_h_trabajo/acta/${acta.id_acta}`);
        setImagenesHojaTrabajo(imgHTrabRes.data || []);
      } catch (imgHTrabErr) {
        console.error('Error al cargar imágenes de hoja de trabajo:', imgHTrabErr);
        setImagenesHojaTrabajo([]);
      }

      setError('');
      setSuccess('');
    } catch (err) {
      console.error('Error al preparar edición:', err);
      setError('❌ Error al preparar la edición');
    }
  };

  const handleViewDetails = async (acta) => {
    try {
      setModalActa(acta);

      // Fetch voting details for this acta
      try {
        const votosRes = await api.get(`/api/votos_detalle/acta/${acta.id_acta}`);
        setVotosDetalle(votosRes.data || []);
      } catch (votosErr) {
        console.error('Error al cargar votos detalle:', votosErr);
        setVotosDetalle([]);
      }

      // Fetch images for this acta from f_acta table
      try {
        const imgActaRes = await api.get(`/api/fotos_acta/acta/${acta.id_acta}`);
        setImagenesActa(imgActaRes.data || []);
      } catch (imgActaErr) {
        console.error('Error al cargar imágenes de acta:', imgActaErr);
        setImagenesActa([]);
      }

      // Fetch images for this acta's hoja de trabajo from f_h_trabajo table
      try {
        const imgHTrabRes = await api.get(`/api/fotos_h_trabajo/acta/${acta.id_acta}`);
        setImagenesHojaTrabajo(imgHTrabRes.data || []);
      } catch (imgHTrabErr) {
        console.error('Error al cargar imágenes de hoja de trabajo:', imgHTrabErr);
        setImagenesHojaTrabajo([]);
      }

      setShowModal(true);
    } catch (err) {
      console.error('Error al cargar detalles:', err);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalActa(null);
    setVotosDetalle([]);
    setImagenesActa([]);
    setImagenesHojaTrabajo([]);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setVotosDetalle([]);
    setImagenesActa([]);
    setImagenesHojaTrabajo([]);
  };

  const handleSaveEdit = async (id_acta) => {
    try {
      setError('');
      if (!editForm.codigo_acta?.trim()) {
        setError('❌ El código de acta es obligatorio');
        return;
      }

      // Prepare data based on acta type
      const updateData = { ...editForm };
      
      // If acta is SUBNACIONAL or NACIONAL, ensure municipal fields are zero or minimal
      if (updateData.tipo_papeleta === 'SUBNACIONAL' || updateData.tipo_papeleta === 'NACIONAL') {
        updateData.votos_blancos_a = updateData.votos_blancos_a || 0;
        updateData.votos_nulos_a = updateData.votos_nulos_a || 0;
        updateData.votos_blancos_c = updateData.votos_blancos_c || 0;
        updateData.votos_nulos_c = updateData.votos_nulos_c || 0;
      }
      
      // If acta is MUNICIPAL, ensure gubernatorial fields are zero or minimal
      if (updateData.tipo_papeleta === 'MUNICIPAL') {
        updateData.votos_blancos_g = updateData.votos_blancos_g || 0;
        updateData.votos_nulos_g = updateData.votos_nulos_g || 0;
        updateData.votos_blancos_p = updateData.votos_blancos_p || 0;
        updateData.votos_nulos_p = updateData.votos_nulos_p || 0;
        updateData.votos_blancos_t = updateData.votos_blancos_t || 0;
        updateData.votos_nulos_t = updateData.votos_nulos_t || 0;
      }

      await api.put(`/api/actas/${id_acta}`, updateData);
      setSuccess('✅ Acta actualizada exitosamente');

      // Recargar lista
      setTimeout(() => {
        loadActas();
        setEditingId(null);
        setEditForm({});
      }, 1000);
    } catch (err) {
      console.error('Error al actualizar acta', err);
      setError(err.response?.data?.detail || '❌ Error al actualizar la acta');
    }
  };

  const handleDelete = (id_acta) => {
    setDeleteConfirm(id_acta);
  };

  const confirmDelete = async (id_acta) => {
    try {
      setError('');
      await api.delete(`/api/actas/${id_acta}`);
      setSuccess('✅ Acta eliminada exitosamente');

      // Recargar lista
      setTimeout(() => {
        loadActas();
        setDeleteConfirm(null);
      }, 1000);
    } catch (err) {
      console.error('Error al eliminar acta', err);
      setError(err.response?.data?.detail || '❌ Error al eliminar la acta');
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">⏳ Cargando actas...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">📋 Administración de Actas</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
        >
          ↩️ Volver al Dashboard
        </button>
      </div>

      {/* Mensajes de error y éxito */}
      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 border border-red-200">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4 border border-green-200">{success}</div>}

      {/* Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Buscar por código de acta o ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nº Mesa"
            value={filters.mesa}
            onChange={e => handleFilterChange('mesa', e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Recinto"
            value={filters.recinto}
            onChange={e => handleFilterChange('recinto', e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Municipio"
            value={filters.municipio}
            onChange={e => handleFilterChange('municipio', e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Provincia"
            value={filters.provincia}
            onChange={e => handleFilterChange('provincia', e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Departamento"
            value={filters.departamento}
            onChange={e => handleFilterChange('departamento', e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            ↺ Restablecer filtros
          </button>
        </div>
      </div>

      {/* Tabla de actas */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="text-sm text-gray-600 mb-4">
          Mostrando <strong>{filteredActas.length}</strong> de <strong>{actas.length}</strong> actas
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">🔽</th>
                <th className="py-3 px-4 text-left font-semibold">ID</th>
                <th className="py-3 px-4 text-left font-semibold">Código Acta</th>
                <th className="py-3 px-4 text-left font-semibold">Mesa</th>
                <th className="py-3 px-4 text-left font-semibold">Tipo</th>
                <th className="py-3 px-4 text-left font-semibold">Blancos Gob.</th>
                <th className="py-3 px-4 text-left font-semibold">Nulos Gob.</th>
                <th className="py-3 px-4 text-left font-semibold">Blancos Alc.</th>
                <th className="py-3 px-4 text-left font-semibold">Nulos Alc.</th>
                <th className="py-3 px-4 text-left font-semibold">Total Actas</th>
                <th className="py-3 px-4 text-left font-semibold">Fecha</th>
                <th className="py-3 px-4 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredActas.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-6 text-gray-500">
                    📭 No se encontraron actas
                  </td>
                </tr>
              ) : (
                filteredActas.map((acta) => (
                  <React.Fragment key={acta.id_acta}>
                    {editingId === acta.id_acta ? (
                      // FILA DE EDICIÓN
                      <tr className="bg-blue-50 border-b-2 border-blue-200">
                        <td className="py-3 px-4"></td>
                        <td className="py-3 px-4">{acta.id_acta}</td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editForm.codigo_acta}
                            onChange={e => setEditForm({ ...editForm, codigo_acta: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Código de acta"
                          />
                        </td>
                        <td className="py-3 px-4">{acta.id_mesa}</td>
                        <td className="py-3 px-4">
                          <select
                            value={editForm.tipo_papeleta}
                            onChange={e => setEditForm({ ...editForm, tipo_papeleta: e.target.value })}
                            className="p-2 border border-gray-300 rounded"
                          >
                            <option value="NACIONAL">Nacional</option>
                            <option value="SUBNACIONAL">Subnacional</option>
                            <option value="REGIONAL">Regional</option>
                            <option value="MUNICIPAL">Municipal</option>
                          </select>
                        </td>
                        {/* Show gubernatorial inputs only for SUBNACIONAL/NACIONAL actas */}
                        {(editForm.tipo_papeleta === 'SUBNACIONAL' || editForm.tipo_papeleta === 'NACIONAL') ? (
                          <>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={editForm.votos_blancos_g || 0}
                                onChange={e => setEditForm({ ...editForm, votos_blancos_g: parseInt(e.target.value) || 0 })}
                                className="w-16 p-2 border border-gray-300 rounded text-center"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={editForm.votos_nulos_g || 0}
                                onChange={e => setEditForm({ ...editForm, votos_nulos_g: parseInt(e.target.value) || 0 })}
                                className="w-16 p-2 border border-gray-300 rounded text-center"
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4 text-center text-gray-400">-</td>
                            <td className="py-3 px-4 text-center text-gray-400">-</td>
                          </>
                        )}

                        {/* Show municipal inputs only for MUNICIPAL actas */}
                        {(editForm.tipo_papeleta === 'MUNICIPAL') ? (
                          <>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={editForm.votos_blancos_a || 0}
                                onChange={e => setEditForm({ ...editForm, votos_blancos_a: parseInt(e.target.value) || 0 })}
                                className="w-16 p-2 border border-gray-300 rounded text-center"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={editForm.votos_nulos_a || 0}
                                onChange={e => setEditForm({ ...editForm, votos_nulos_a: parseInt(e.target.value) || 0 })}
                                className="w-16 p-2 border border-gray-300 rounded text-center"
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4 text-center text-gray-400">-</td>
                            <td className="py-3 px-4 text-center text-gray-400">-</td>
                          </>
                        )}
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={editForm.total_actas || 0}
                            onChange={e => setEditForm({ ...editForm, total_actas: parseInt(e.target.value) || 0 })}
                            className="w-16 p-2 border border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="py-3 px-4">{new Date(acta.fecha_registro).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleSaveEdit(acta.id_acta)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-medium text-sm mr-2"
                          >
                            ✓ Guardar
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 font-medium text-sm"
                          >
                            ✕ Cancelar
                          </button>
                        </td>
                      </tr>
                    ) : (
                      // FILA NORMAL
                      <React.Fragment>
                      <tr 
                          className="border-b hover:bg-gray-50 cursor-pointer" 
                          onClick={() => setExpandedActa(expandedActa === acta.id_acta ? null : acta.id_acta)}
                        >
                          <td className="py-3 px-4 text-center">
                            <span className="text-lg">{expandedActa === acta.id_acta ? '▼' : '▶'}</span>
                          </td>
                          <td className="py-3 px-4 text-sm">{acta.id_acta}</td>
                          <td className="py-3 px-4 font-mono text-blue-600">{acta.codigo_acta}</td>
                          <td className="py-3 px-4">{acta.id_mesa}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                              {acta.tipo_papeleta}
                            </span>
                          </td>
                          {/* Show gubernatorial data only for SUBNACIONAL/NACIONAL actas */}
                          {(acta.tipo_papeleta === 'SUBNACIONAL' || acta.tipo_papeleta === 'NACIONAL') ? (
                            <>
                              <td className="py-3 px-4">{acta.votos_blancos_g || 0}</td>
                              <td className="py-3 px-4">{acta.votos_nulos_g || 0}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-4 text-center text-gray-400">-</td>
                              <td className="py-3 px-4 text-center text-gray-400">-</td>
                            </>
                          )}

                          {/* Show municipal data only for MUNICIPAL actas */}
                          {(acta.tipo_papeleta === 'MUNICIPAL') ? (
                            <>
                              <td className="py-3 px-4">{acta.votos_blancos_a || 0}</td>
                              <td className="py-3 px-4">{acta.votos_nulos_a || 0}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-4 text-center text-gray-400">-</td>
                              <td className="py-3 px-4 text-center text-gray-400">-</td>
                            </>
                          )}
                          <td className="py-3 px-4">{acta.total_actas || 0}</td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(acta.fecha_registro).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(acta);
                              }}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-medium text-sm mr-2"
                            >
                              👁️ Ver
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(acta);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm mr-2"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(acta.id_acta);
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm"
                            >
                              🗑️ Eliminar
                            </button>
                          </td>
                        </tr>

                        {/* FILA EXPANDIDA - DETALLES DE VOTOS */}
                        {expandedActa === acta.id_acta && (
                          <tr className="bg-blue-50 border-b-2 border-blue-200">
                            <td colSpan="11" className="py-4 px-6">
                              <div className="bg-white p-4 rounded border border-blue-200">
                                <h4 className="font-semibold text-blue-800 mb-3">📊 Detalles de Votos por Cargo Electoral</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                  {/* Total Actas Information */}
                                  <div className="bg-purple-50 p-3 rounded border border-purple-200 col-span-full">
                                    <h5 className="font-semibold text-purple-700 mb-2">🔢 Total Actas Registradas</h5>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span>Total Actas:</span>
                                        <span className="font-medium">{acta.total_actas || 0}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Gubernatorial positions (show only for SUBNACIONAL actas) */}
                                  {(acta.tipo_papeleta === 'SUBNACIONAL' || acta.tipo_papeleta === 'NACIONAL') && (
                                    <>
                                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                        <h5 className="font-semibold text-blue-700 mb-2">🏛️ Gobernador</h5>
                                        <div className="space-y-1">
                                          <div className="flex justify-between">
                                            <span>Blancos:</span>
                                            <span className="font-medium">{acta.votos_blancos_g || 0}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Nulos:</span>
                                            <span className="font-medium">{acta.votos_nulos_g || 0}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                        <h5 className="font-semibold text-blue-700 mb-2">👥 Asambleista Población</h5>
                                        <div className="space-y-1">
                                          <div className="flex justify-between">
                                            <span>Blancos:</span>
                                            <span className="font-medium">{acta.votos_blancos_p || 0}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Nulos:</span>
                                            <span className="font-medium">{acta.votos_nulos_p || 0}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                        <h5 className="font-semibold text-blue-700 mb-2">🗺️ Asambleista Territorio</h5>
                                        <div className="space-y-1">
                                          <div className="flex justify-between">
                                            <span>Blancos:</span>
                                            <span className="font-medium">{acta.votos_blancos_t || 0}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Nulos:</span>
                                            <span className="font-medium">{acta.votos_nulos_t || 0}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  {/* Municipal positions (show only for MUNICIPAL actas) */}
                                  {(acta.tipo_papeleta === 'MUNICIPAL') && (
                                    <>
                                      <div className="bg-green-50 p-3 rounded border border-green-200">
                                        <h5 className="font-semibold text-green-700 mb-2">🏘️ Alcalde</h5>
                                        <div className="space-y-1">
                                          <div className="flex justify-between">
                                            <span>Blancos:</span>
                                            <span className="font-medium">{acta.votos_blancos_a || 0}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Nulos:</span>
                                            <span className="font-medium">{acta.votos_nulos_a || 0}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-green-50 p-3 rounded border border-green-200">
                                        <h5 className="font-semibold text-green-700 mb-2">🏛️ Concejal</h5>
                                        <div className="space-y-1">
                                          <div className="flex justify-between">
                                            <span>Blancos:</span>
                                            <span className="font-medium">{acta.votos_blancos_c || 0}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Nulos:</span>
                                            <span className="font-medium">{acta.votos_nulos_c || 0}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  {/* Show message if no relevant data for this acta type */}
                                  {acta.tipo_papeleta !== 'SUBNACIONAL' && acta.tipo_papeleta !== 'NACIONAL' && acta.tipo_papeleta !== 'MUNICIPAL' && (
                                    <div className="col-span-full bg-yellow-50 p-4 rounded border border-yellow-200 text-center">
                                      <p className="text-yellow-700">No se encontraron datos específicos para este tipo de acta: {acta.tipo_papeleta}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-4">
                                  <h5 className="font-semibold text-gray-700 mb-2">Votos por Organización Política</h5>
                                  {acta.votos_detalle && acta.votos_detalle.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {acta.votos_detalle.map((voto, index) => (
                                        <div key={index} className="bg-gray-100 p-2 rounded border border-gray-200">
                                          <div className="flex justify-between items-center">
                                            <div>
                                              <p className="font-medium text-gray-800">{voto.nombre}</p>
                                              <p className="text-xs text-gray-500">{voto.sigla}</p>
                                            </div>
                                            <p className="text-lg font-bold text-blue-600">{voto.votos_cantidad}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 italic">Sin votos registrados</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )}
                  </React.Fragment>
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
              ¿Está seguro de que desea eliminar esta acta? Esta acción no se puede deshacer.
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

      {/* Modal de Detalles de Acta */}
      {showModal && modalActa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">📋 Detalles de Acta</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-light"
                >
                  &times;
                </button>
              </div>
              <div className="mt-2 text-gray-600">
                <p><span className="font-semibold">ID:</span> {modalActa.id_acta}</p>
                <p><span className="font-semibold">Código:</span> {modalActa.codigo_acta}</p>
                <p><span className="font-semibold">Tipo:</span> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{modalActa.tipo_papeleta}</span></p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Información General */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">📋 Información General</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mesa:</span>
                      <span className="font-medium">{modalActa.id_mesa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Actas:</span>
                      <span className="font-medium">{modalActa.total_actas || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Observaciones:</span>
                      <span className="font-medium">{modalActa.observaciones || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Votos Blancos y Nulos por Categoría Electoral */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">🗳️ Votos Blancos y Nulos por Categoría Electoral</h3>
                  
                  {/* Gobernador */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-blue-700 mb-2">🏛️ Gobernador</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600">Blancos</p>
                        <p className="text-xl font-bold text-blue-600">{modalActa.votos_blancos_g || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600">Nulos</p>
                        <p className="text-xl font-bold text-red-600">{modalActa.votos_nulos_g || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Asambleista por Territorio */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-green-700 mb-2">🗺️ Asambleista por Territorio</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600">Blancos</p>
                        <p className="text-xl font-bold text-green-600">{modalActa.votos_blancos_t || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600">Nulos</p>
                        <p className="text-xl font-bold text-red-600">{modalActa.votos_nulos_t || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Asambleista por Población */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-purple-700 mb-2">👥 Asambleista por Población</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600">Blancos</p>
                        <p className="text-xl font-bold text-purple-600">{modalActa.votos_blancos_p || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600">Nulos</p>
                        <p className="text-xl font-bold text-red-600">{modalActa.votos_nulos_p || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Alcalde */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-red-700 mb-2">🏘️ Alcalde</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600">Blancos</p>
                        <p className="text-xl font-bold text-red-600">{modalActa.votos_blancos_a || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600">Nulos</p>
                        <p className="text-xl font-bold text-orange-600">{modalActa.votos_nulos_a || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Concejal */}
                  <div>
                    <h4 className="font-semibold text-yellow-700 mb-2">🏛️ Concejal</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600">Blancos</p>
                        <p className="text-xl font-bold text-yellow-600">{modalActa.votos_blancos_c || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600">Nulos</p>
                        <p className="text-xl font-bold text-red-600">{modalActa.votos_nulos_c || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles de Votos por Organización y Categoría Electoral */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">📊 Votos por Organización Política y Categoría Electoral</h3>
                
                {/* Votos para Gobernador */}
                <div className="mb-4">
                  <h4 className="font-semibold text-blue-700 mb-2">🏛️ Gobernador</h4>
                  {votosDetalle && votosDetalle.filter(v => v.tipo_voto === 'GOBERNADOR').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {votosDetalle
                        .filter(v => v.tipo_voto === 'GOBERNADOR')
                        .map((voto, index) => (
                          <div key={index} className="bg-blue-50 p-3 rounded border border-blue-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-blue-800">{voto.nombre || 'N/A'}</p>
                                <p className="text-xs text-blue-600">{voto.sigla || 'N/A'}</p>
                              </div>
                              <p className="text-xl font-bold text-blue-600">{voto.votos_cantidad || 0}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No hay votos registrados para Gobernador</p>
                  )}
                </div>

                {/* Votos para Asambleista por Territorio */}
                <div className="mb-4">
                  <h4 className="font-semibold text-green-700 mb-2">🗺️ Asambleista por Territorio</h4>
                  {votosDetalle && votosDetalle.filter(v => v.tipo_voto === 'ASAMBLEISTA_TERRITORIO').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {votosDetalle
                        .filter(v => v.tipo_voto === 'ASAMBLEISTA_TERRITORIO')
                        .map((voto, index) => (
                          <div key={index} className="bg-green-50 p-3 rounded border border-green-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-green-800">{voto.nombre || 'N/A'}</p>
                                <p className="text-xs text-green-600">{voto.sigla || 'N/A'}</p>
                              </div>
                              <p className="text-xl font-bold text-green-600">{voto.votos_cantidad || 0}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No hay votos registrados para Asambleista por Territorio</p>
                  )}
                </div>

                {/* Votos para Asambleista por Población */}
                <div className="mb-4">
                  <h4 className="font-semibold text-purple-700 mb-2">👥 Asambleista por Población</h4>
                  {votosDetalle && votosDetalle.filter(v => v.tipo_voto === 'ASAMBLEISTA_POBLACION').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {votosDetalle
                        .filter(v => v.tipo_voto === 'ASAMBLEISTA_POBLACION')
                        .map((voto, index) => (
                          <div key={index} className="bg-purple-50 p-3 rounded border border-purple-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-purple-800">{voto.nombre || 'N/A'}</p>
                                <p className="text-xs text-purple-600">{voto.sigla || 'N/A'}</p>
                              </div>
                              <p className="text-xl font-bold text-purple-600">{voto.votos_cantidad || 0}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No hay votos registrados para Asambleista por Población</p>
                  )}
                </div>

                {/* Votos para Alcalde */}
                <div className="mb-4">
                  <h4 className="font-semibold text-red-700 mb-2">🏘️ Alcalde</h4>
                  {votosDetalle && votosDetalle.filter(v => v.tipo_voto === 'ALCALDE').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {votosDetalle
                        .filter(v => v.tipo_voto === 'ALCALDE')
                        .map((voto, index) => (
                          <div key={index} className="bg-red-50 p-3 rounded border border-red-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-red-800">{voto.nombre || 'N/A'}</p>
                                <p className="text-xs text-red-600">{voto.sigla || 'N/A'}</p>
                              </div>
                              <p className="text-xl font-bold text-red-600">{voto.votos_cantidad || 0}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No hay votos registrados para Alcalde</p>
                  )}
                </div>

                {/* Votos para Concejal */}
                <div>
                  <h4 className="font-semibold text-yellow-700 mb-2">🏛️ Concejal</h4>
                  {votosDetalle && votosDetalle.filter(v => v.tipo_voto === 'CONCEJAL').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {votosDetalle
                        .filter(v => v.tipo_voto === 'CONCEJAL')
                        .map((voto, index) => (
                          <div key={index} className="bg-yellow-50 p-3 rounded border border-yellow-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-yellow-800">{voto.nombre || 'N/A'}</p>
                                <p className="text-xs text-yellow-600">{voto.sigla || 'N/A'}</p>
                              </div>
                              <p className="text-xl font-bold text-yellow-600">{voto.votos_cantidad || 0}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No hay votos registrados para Concejal</p>
                  )}
                </div>
              </div>

              {/* Imágenes de Acta */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">📸 Imágenes de Acta</h3>
                {imagenesActa && imagenesActa.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagenesActa.map((img, index) => (
                      <div key={img.id_foto_acta || img.id_acta || index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Imagen {index + 1}</p>
                        {img.url_imagen ? (
                          <a href={img.url_imagen} target="_blank" rel="noopener noreferrer">
                            <img
                              src={img.url_imagen}
                              alt={`Acta ${index + 1}`}
                              className="w-full h-40 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-90"
                            />
                          </a>
                        ) : (
                          <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded border border-gray-300">
                            <span className="text-gray-500">No disponible</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-center">
                    <p className="text-yellow-700 italic">⚠️ No hay imágenes de acta registradas</p>
                  </div>
                )}
              </div>

              {/* Imágenes de Hoja de Trabajo */}
              <div>
                <h3 className="font-semibold text-lg text-gray-800 mb-3">📄 Imágenes de Hoja de Trabajo</h3>
                {imagenesHojaTrabajo && imagenesHojaTrabajo.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagenesHojaTrabajo.map((img, index) => (
                      <div key={img.id_foto_h_trabajo || img.id_acta || index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Hoja Trabajo {index + 1}</p>
                        {img.url_imagen ? (
                          <a href={img.url_imagen} target="_blank" rel="noopener noreferrer">
                            <img
                              src={img.url_imagen}
                              alt={`Hoja Trabajo ${index + 1}`}
                              className="w-full h-40 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-90"
                            />
                          </a>
                        ) : (
                          <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded border border-gray-300">
                            <span className="text-gray-500">No disponible</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-center">
                    <p className="text-yellow-700 italic">⚠️ No hay imágenes de hoja de trabajo registradas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}