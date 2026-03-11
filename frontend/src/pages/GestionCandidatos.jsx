// frontend/src/pages/GestionCandidatos.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GestionCandidatos() {
  const navigate = useNavigate();
  const [candidatos, setCandidatos] = useState([]);
  const [filteredCandidatos, setFilteredCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    organizacion: '',
    cargo: '',
    tipo: '',
    genero: ''
  });
  const [catalogs, setCatalogs] = useState({
    organizaciones: {},
    cargos: {},
    departamentos: {},
    provincias: {},
    municipios: {},
  });

  const loadData = async () => {
    try {
      const [candRes, orgRes, cargoRes, deptoRes] = await Promise.all([
        api.get('/candidatos/listar'),
        api.get('/catalog?table=organizaciones_politicas'),
        api.get('/catalog?table=cargos'),
        api.get('/catalog?table=departamentos'),
      ]);
      const candidates = candRes.data || [];
      setCandidatos(candidates);
      setFilteredCandidatos(candidates);
      setCatalogs(prev => ({
        ...prev,
        organizaciones: orgRes.data || {},
        cargos: cargoRes.data || {},
        departamentos: deptoRes.data || {},
      }));
    } catch (err) {
      console.error("Error al cargar datos:", err);
      alert('❌ Error al cargar candidatos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado combinado
  useEffect(() => {
    let result = candidatos;

    // Filtro por texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(cand => {
        const nombreCompleto = `${cand.nombres} ${cand.apellidos}`.toLowerCase();
        const org = getCatalogValue(catalogs.organizaciones, cand.id_organizacion).toLowerCase();
        const cargo = getCatalogValue(catalogs.cargos, cand.id_cargo).toLowerCase();
        return nombreCompleto.includes(term) || org.includes(term) || cargo.includes(term);
      });
    }

    // Filtros avanzados
    if (filters.organizacion) {
      result = result.filter(c => c.id_organizacion == filters.organizacion);
    }
    if (filters.cargo) {
      result = result.filter(c => c.id_cargo == filters.cargo);
    }
    if (filters.tipo) {
      result = result.filter(c => c.tipo_candidatura === filters.tipo);
    }
    if (filters.genero) {
      result = result.filter(c => c.genero === filters.genero);
    }

    setFilteredCandidatos(result);
  }, [searchTerm, filters, candidatos, catalogs]);

  useEffect(() => {
    loadData();
  }, []);

  const getCatalogValue = (catalog, id) => {
    const entry = Object.entries(catalog || {}).find(([, val]) => val == id);
    return entry ? entry[0] : '—';
  };

  const loadProvincias = async (idDepto) => {
    try {
      const res = await api.get(`/provincias/departamento/${idDepto}`);
      setCatalogs(prev => ({ ...prev, provincias: res.data || {} }));
    } catch (err) {
      console.error('Error al cargar provincias:', err);
      alert('❌ Error al cargar provincias');
    }
  };

  const loadMunicipios = async (idProv) => {
    try {
      const res = await api.get(`/municipios/provincia/${idProv}`);
      setCatalogs(prev => ({ ...prev, municipios: res.data || {} }));
    } catch (err) {
      console.error('Error al cargar municipios:', err);
      alert('❌ Error al cargar municipios');
    }
  };

  const startEdit = async (candidato) => {
    setEditingId(candidato.id_candidato);
    setEditForm({
      orden: candidato.orden ?? '',
      posicion: candidato.posicion ?? '',
      id_organizacion: candidato.id_organizacion ?? '',
      id_cargo: candidato.id_cargo ?? '',
      id_departamento: candidato.id_departamento ?? '',
      id_provincia: candidato.id_provincia ?? '',
      id_municipio: candidato.id_municipio ?? '',
      nombres: candidato.nombres ?? '',
      apellidos: candidato.apellidos ?? '',
      genero: candidato.genero ?? 'M',
      edad: candidato.edad ?? '',
      tipo_candidatura: candidato.tipo_candidatura ?? 'TITULAR',
    });
    if (candidato.id_departamento) loadProvincias(candidato.id_departamento);
    if (candidato.id_provincia) loadMunicipios(candidato.id_provincia);
  };

  const saveEdit = async () => {
    if (!editForm.orden || !editForm.posicion) {
      alert('⚠️ Los campos "Orden" y "Posición" son obligatorios');
      return;
    }
    try {
      await api.put(`/candidatos/actualizar/${editingId}`, editForm);
      await loadData();
      setEditingId(null);
    } catch (err) {
      alert('❌ Error al actualizar candidato');
      console.error(err);
    }
  };

  const deleteCandidato = async (id) => {
    if (!window.confirm('¿Eliminar candidato?')) return;
    try {
      await api.delete(`/candidatos/eliminar/${id}`);
      await loadData();
    } catch (err) {
      alert('❌ Error al eliminar candidato');
    }
  };

  const handleDeptoChange = (e) => {
    const id = e.target.value;
    setEditForm(prev => ({ ...prev, id_departamento: id, id_provincia: '', id_municipio: '' }));
    if (id) loadProvincias(id);
    else setCatalogs(prev => ({ ...prev, provincias: {}, municipios: {} }));
  };

  const handleProvChange = (e) => {
    const id = e.target.value;
    setEditForm(prev => ({ ...prev, id_provincia: id, id_municipio: '' }));
    if (id) loadMunicipios(id);
    else setCatalogs(prev => ({ ...prev, municipios: {} }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ organizacion: '', cargo: '', tipo: '', genero: '' });
  };

  if (loading) return <div className="p-6 text-center">Cargando candidatos...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Candidatos</h1>
          
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Volver
            </button>
            <button
              onClick={() => navigate('/candidatos')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              + Nuevo Candidato
            </button>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Búsqueda general */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, organización o cargo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Filtros */}
            <select
              value={filters.organizacion}
              onChange={e => handleFilterChange('organizacion', e.target.value)}
              className="p-2 border rounded-lg"
            >
              <option value="">Todas las organizaciones</option>
              {Object.entries(catalogs.organizaciones).map(([name, id]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>

            <select
              value={filters.cargo}
              onChange={e => handleFilterChange('cargo', e.target.value)}
              className="p-2 border rounded-lg"
            >
              <option value="">Todos los cargos</option>
              {Object.entries(catalogs.cargos).map(([name, id]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>

            <select
              value={filters.tipo}
              onChange={e => handleFilterChange('tipo', e.target.value)}
              className="p-2 border rounded-lg"
            >
              <option value="">Todos los tipos</option>
              <option value="TITULAR">Titular</option>
              <option value="SUPLENTE">Suplente</option>
            </select>

            <select
              value={filters.genero}
              onChange={e => handleFilterChange('genero', e.target.value)}
              className="p-2 border rounded-lg"
            >
              <option value="">Todos los géneros</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ↺ Restablecer filtros
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">Orden</th>
                <th className="py-2 px-4 text-left">Posición</th>
                <th className="py-2 px-4 text-left">Nombre Completo</th>
                <th className="py-2 px-4 text-left">Organización</th>
                <th className="py-2 px-4 text-left">Cargo</th>
                <th className="py-2 px-4 text-left">Departamento</th>
                <th className="py-2 px-4 text-left">Municipio</th>
                <th className="py-2 px-4 text-left">Tipo</th>
                <th className="py-2 px-4 text-left">Género</th>
                <th className="py-2 px-4 text-left">Edad</th>
                <th className="py-2 px-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidatos.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-4 text-gray-500">
                    No se encontraron candidatos
                  </td>
                </tr>
              ) : (
                filteredCandidatos.map((cand) => (
                  <tr key={cand.id_candidato} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{cand.orden}</td>
                    <td className="py-2 px-4">{cand.posicion}</td>
                    <td className="py-2 px-4">
                      {cand.nombres} {cand.apellidos}
                    </td>
                    <td className="py-2 px-4">{getCatalogValue(catalogs.organizaciones, cand.id_organizacion)}</td>
                    <td className="py-2 px-4">{getCatalogValue(catalogs.cargos, cand.id_cargo)}</td>
                    <td className="py-2 px-4">{getCatalogValue(catalogs.departamentos, cand.id_departamento)}</td>
                    <td className="py-2 px-4">{getCatalogValue(catalogs.municipios, cand.id_municipio)}</td>
                    <td className="py-2 px-4">
                      {cand.tipo_candidatura === 'TITULAR' ? 'Titular' : 'Suplente'}
                    </td>
                    <td className="py-2 px-4">
                      {cand.genero === 'F' ? 'Femenino' : 'Masculino'}
                    </td>
                    <td className="py-2 px-4">{cand.edad || 'N/A'}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => startEdit(cand)}
                        className="mr-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteCandidato(cand.id_candidato)}
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

      {/* Modal de edición */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Editar Candidato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="number"
                placeholder="Orden"
                value={editForm.orden}
                onChange={e => setEditForm({ ...editForm, orden: e.target.value })}
                className="p-2 border rounded"
                min="1"
                required
              />
              <input
                type="number"
                placeholder="Posición"
                value={editForm.posicion}
                onChange={e => setEditForm({ ...editForm, posicion: e.target.value })}
                className="p-2 border rounded"
                min="1"
                required
              />
              <input
                placeholder="Nombres"
                value={editForm.nombres}
                onChange={e => setEditForm({ ...editForm, nombres: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <input
                placeholder="Apellidos"
                value={editForm.apellidos}
                onChange={e => setEditForm({ ...editForm, apellidos: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <select
                value={editForm.genero}
                onChange={e => setEditForm({ ...editForm, genero: e.target.value })}
                className="p-2 border rounded"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
              <input
                type="number"
                placeholder="Edad"
                value={editForm.edad}
                onChange={e => setEditForm({ ...editForm, edad: e.target.value })}
                className="p-2 border rounded"
                min="18"
                max="120"
              />
              <select
                value={editForm.tipo_candidatura}
                onChange={e => setEditForm({ ...editForm, tipo_candidatura: e.target.value })}
                className="p-2 border rounded"
              >
                <option value="TITULAR">Titular</option>
                <option value="SUPLENTE">Suplente</option>
              </select>
              <select
                value={editForm.id_organizacion}
                onChange={e => setEditForm({ ...editForm, id_organizacion: e.target.value })}
                className="p-2 border rounded"
                required
              >
                <option value="">Organización</option>
                {Object.entries(catalogs.organizaciones).map(([name, id]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <select
                value={editForm.id_cargo}
                onChange={e => setEditForm({ ...editForm, id_cargo: e.target.value })}
                className="p-2 border rounded"
                required
              >
                <option value="">Cargo</option>
                {Object.entries(catalogs.cargos).map(([name, id]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <select
                value={editForm.id_departamento}
                onChange={handleDeptoChange}
                className="p-2 border rounded"
              >
                <option value="">Departamento</option>
                {Object.entries(catalogs.departamentos).map(([name, id]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <select
                value={editForm.id_provincia}
                onChange={handleProvChange}
                className="p-2 border rounded"
                disabled={!editForm.id_departamento}
              >
                <option value="">Provincia</option>
                {Object.entries(catalogs.provincias).map(([name, id]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <select
                value={editForm.id_municipio}
                onChange={e => setEditForm({ ...editForm, id_municipio: e.target.value })}
                className="p-2 border rounded"
                disabled={!editForm.id_provincia}
              >
                <option value="">Municipio</option>
                {Object.entries(catalogs.municipios).map(([name, id]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
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