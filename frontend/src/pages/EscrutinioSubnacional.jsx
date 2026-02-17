// frontend/src/pages/EscrutinioSubnacional.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function EscrutinioSubnacional() {
  const navigate = useNavigate();
  
  // === Estado para REGISTRO ===
  const [formData, setFormData] = useState({
    id_mesa: '',
    tipo: 'SUBNACIONAL',
    blancos: 0,
    nulos: 0,
    observaciones: '',
    user_id: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null,
  });
  const [organizaciones, setOrganizaciones] = useState([]);
  const [votosPorOrg, setVotosPorOrg] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // === Estado para LISTADO Y EDICIÓN ===
  const [actas, setActas] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // === Catálogos geográficos ===
  const [catalogs, setCatalogs] = useState({
    deptos: {},
  });
  const [provs, setProvs] = useState({});
  const [munis, setMunis] = useState({});
  const [recintos, setRecintos] = useState({});
  const [mesas, setMesas] = useState({});
  const [mesaInfo, setMesaInfo] = useState(null);

  // === Cargar datos iniciales ===
  useEffect(() => {
    const loadData = async () => {
      try {
        setError('');
        setLoading(true);

        // Cargar organizaciones (para votos)
        const orgRes = await api.get('/catalog?table=organizaciones_politicas');
        const orgs = orgRes.data || {};
        setOrganizaciones(Object.entries(orgs).map(([sigla, id]) => ({ id, sigla })));
        const votos = {};
        Object.values(orgs).forEach(id => votos[id] = 0);
        setVotosPorOrg(votos);

        // Cargar departamentos (para cascada)
        const deptoRes = await api.get('/catalog?table=departamentos');
        setCatalogs({ deptos: deptoRes.data || {} });

        // Cargar listado de actas
        const actasRes = await api.get('/escrutinio/actas/subnacional/listar');
        setActas(actasRes.data || []);

      } catch (err) {
        console.error("Error al cargar datos", err);
        setError('❌ Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // === Funciones para cascada geográfica ===
  const handleDeptoChange = async (idDepto) => {
    setFormData(prev => ({ ...prev, id_mesa: '' }));
    setProvs({}); setMunis({}); setRecintos({}); setMesas({});
    setMesaInfo(null);
    if (!idDepto) return;
    try {
      const res = await api.get(`/provincias/departamento/${idDepto}`);
      setProvs(res.data || {});
    } catch (err) {
      console.error('Error al cargar provincias', err);
      alert('❌ Error al cargar provincias');
    }
  };

  const handleProvChange = async (idProv) => {
    setFormData(prev => ({ ...prev, id_mesa: '' }));
    setMunis({}); setRecintos({}); setMesas({});
    setMesaInfo(null);
    if (!idProv) return;
    try {
      const res = await api.get(`/municipios/provincia/${idProv}`);
      setMunis(res.data || {});
    } catch (err) {
      console.error('Error al cargar municipios', err);
      alert('❌ Error al cargar municipios');
    }
  };

  const handleMuniChange = async (idMuni) => {
    setFormData(prev => ({ ...prev, id_mesa: '' }));
    setRecintos({}); setMesas({});
    setMesaInfo(null);
    if (!idMuni) return;
    try {
      const res = await api.get(`/recintos/municipio/${idMuni}`);
      setRecintos(res.data || {});
    } catch (err) {
      console.error('Error al cargar recintos', err);
      alert('❌ Error al cargar recintos');
    }
  };

  const handleRecintoChange = async (idRecinto) => {
    setFormData(prev => ({ ...prev, id_mesa: '' }));
    setMesas({});
    setMesaInfo(null);
    if (!idRecinto) return;
    try {
      const res = await api.get(`/mesas/recinto/${idRecinto}`);
      setMesas(res.data || {});
    } catch (err) {
      console.error('Error al cargar mesas', err);
      alert('❌ Error al cargar mesas');
    }
  };

 const handleMesaChange = async (idMesa) => {
  setFormData(prev => ({ ...prev, id_mesa: idMesa })); // ← Usa el parámetro correctamente
  if (!idMesa) {
    setMesaInfo(null);
    return;
  }
  try {
    const res = await api.get(`/mesas/${idMesa}`);
    setMesaInfo(res.data);
  } catch (err) {
    console.error('Error al cargar info de mesa', err);
    setMesaInfo(null);
  }
};

  // === Manejo de votos ===
  const handleVotoChange = (idOrg, value) => {
    const num = value === '' ? 0 : parseInt(value) || 0;
    setVotosPorOrg(prev => ({ ...prev, [idOrg]: num }));
  };

  // === Registro de acta ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_mesa) {
      alert('⚠️ Seleccione una mesa de votación');
      return;
    }
    const totalVotos = Object.values(votosPorOrg).reduce((sum, v) => sum + v, 0);
    if (totalVotos === 0 && formData.blancos === 0 && formData.nulos === 0) {
      alert('⚠️ Ingrese al menos un voto');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        votos_partidos: votosPorOrg,
      };
      await api.post('/acta/subnacional', payload);
      alert('✅ Acta registrada exitosamente');
      
      // Recargar lista
      const actasRes = await api.get('/escrutinio/actas/subnacional/listar');
      setActas(actasRes.data || []);
      
      // Resetear formulario
      setFormData({
        id_mesa: '',
        tipo: 'SUBNACIONAL',
        blancos: 0,
        nulos: 0,
        observaciones: '',
        user_id: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null,
      });
      setVotosPorOrg(prev => {
        const reset = {};
        Object.keys(prev).forEach(k => reset[k] = 0);
        return reset;
      });
      setMesaInfo(null);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al registrar acta';
      alert(`❌ ${msg}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // === Edición de acta ===
  const startEdit = (acta) => {
    setEditingId(acta.id_acta);
    setEditForm({
      id_mesa: acta.id_mesa,
      blancos: acta.votos_blancos,
      nulos: acta.votos_nulos,
      observaciones: acta.observaciones || '',
    });
  };

  const saveEdit = async () => {
    try {
      await api.put(`/escrutinio/acta/${editingId}`, editForm);
      alert('✅ Acta actualizada exitosamente');
      const actasRes = await api.get('/escrutinio/actas/subnacional/listar');
      setActas(actasRes.data || []);
      setEditingId(null);
    } catch (err) {
      alert('❌ Error al actualizar acta');
    }
  };

  // === Eliminación de acta ===
  const deleteActa = async (id) => {
    if (!window.confirm('¿Eliminar esta acta? Esta acción es irreversible.')) return;
    try {
      await api.delete(`/escrutinio/acta/${id}`);
      alert('✅ Acta eliminada exitosamente');
      const actasRes = await api.get('/escrutinio/actas/subnacional/listar');
      setActas(actasRes.data || []);
    } catch (err) {
      alert('❌ Error al eliminar acta');
    }
  };

  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🗳️ Escrutinio Subnacional</h1>

      {/* === Formulario de registro === */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">📝 Registrar Nueva Acta</h2>

        {/* Selección geográfica */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <select
            onChange={e => handleDeptoChange(e.target.value)}
            className="p-2 border rounded"
            required
          >
            <option value="">Departamento</option>
            {Object.entries(catalogs.deptos).map(([name, id]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            onChange={e => handleProvChange(e.target.value)}
            className="p-2 border rounded"
            required
            disabled={Object.keys(provs).length === 0}
          >
            <option value="">Provincia</option>
            {Object.entries(provs).map(([name, id]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            onChange={e => handleMuniChange(e.target.value)}
            className="p-2 border rounded"
            required
            disabled={Object.keys(munis).length === 0}
          >
            <option value="">Municipio</option>
            {Object.entries(munis).map(([name, id]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            onChange={e => handleRecintoChange(e.target.value)}
            className="p-2 border rounded"
            required
            disabled={Object.keys(recintos).length === 0}
          >
            <option value="">Recinto</option>
            {Object.entries(recintos).map(([name, id]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            value={formData.id_mesa}
            onChange={e => handleMesaChange(e.target.value)}
            className="p-2 border rounded"
            required
            disabled={Object.keys(mesas).length === 0}
          >
            <option value="">Mesa</option>
            {Object.entries(mesas).map(([num, id]) => (
              <option key={id} value={id}>Mesa {num}</option>
            ))}
          </select>
        </div>

        {/* Info de la mesa seleccionada */}
        {mesaInfo && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
            📍 <strong>Recinto:</strong> {mesaInfo.recinto} | 
            <strong> Municipio:</strong> {mesaInfo.municipio} | 
            <strong> Inscritos:</strong> {mesaInfo.cantidad_inscritos}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Votos por organización */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">📊 Votos por Organización</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {organizaciones.map(org => (
                <div key={org.id} className="flex items-center justify-between">
                  <span>{org.sigla}</span>
                  <input
                    type="number"
                    min="0"
                    value={votosPorOrg[org.id] || 0}
                    onChange={e => handleVotoChange(org.id, e.target.value)}
                    className="w-20 p-1 border rounded text-right"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Blancos y nulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1">Votos en Blanco</label>
              <input
                type="number"
                min="0"
                value={formData.blancos}
                onChange={e => setFormData({ ...formData, blancos: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Votos Nulos</label>
              <input
                type="number"
                min="0"
                value={formData.nulos}
                onChange={e => setFormData({ ...formData, nulos: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div className="mb-4">
            <label className="block mb-1">📝 Observaciones (opcional)</label>
            <textarea
              value={formData.observaciones}
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full p-2 border rounded"
              rows="2"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {loading ? 'Guardando...' : '💾 Registrar Acta'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ⬅️ Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* === Listado de actas === */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">📋 Actas Registradas</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">Mesa</th>
                <th className="py-2 px-4 text-left">Recinto</th>
                <th className="py-2 px-4 text-left">Municipio</th>
                <th className="py-2 px-4 text-left">Blancos</th>
                <th className="py-2 px-4 text-left">Nulos</th>
                <th className="py-2 px-4 text-left">Total Votos</th>
                <th className="py-2 px-4 text-left">Fecha</th>
                <th className="py-2 px-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {actas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500">
                    No se encontraron actas
                  </td>
                </tr>
              ) : (
                actas.map((acta) => (
                  <tr key={acta.id_acta} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{acta.numero_mesa}</td>
                    <td className="py-2 px-4">{acta.recinto}</td>
                    <td className="py-2 px-4">{acta.municipio}</td>
                    <td className="py-2 px-4">{acta.votos_blancos}</td>
                    <td className="py-2 px-4">{acta.votos_nulos}</td>
                    <td className="py-2 px-4">{acta.total_votos}</td>
                    <td className="py-2 px-4">{new Date(acta.fecha_registro).toLocaleDateString()}</td>
                    <td className="py-2 px-4 flex gap-2">
                      <button
                        onClick={() => startEdit(acta)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteActa(acta.id_acta)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === Modal de edición === */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Editar Acta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="number"
                placeholder="Votos en Blanco"
                value={editForm.blancos || 0}
                onChange={e => setEditForm({ ...editForm, blancos: parseInt(e.target.value) || 0 })}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Votos Nulos"
                value={editForm.nulos || 0}
                onChange={e => setEditForm({ ...editForm, nulos: parseInt(e.target.value) || 0 })}
                className="p-2 border rounded"
              />
              <textarea
                placeholder="Observaciones"
                value={editForm.observaciones || ''}
                onChange={e => setEditForm({ ...editForm, observaciones: e.target.value })}
                className="p-2 border rounded col-span-2"
                rows="2"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}