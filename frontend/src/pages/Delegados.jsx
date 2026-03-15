// frontend/src/pages/Delegados.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Delegados() {
  const navigate = useNavigate();
  
  // Form para crear/editar
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    ci: '',
    telefono: '',
    direccion: '',
    id_organizacion: '',
    id_mesa: '',
    id_rol: 6,  // 6 = Delegado
  });
  
  // Datos de delegados
  const [delegados, setDelegados] = useState([]);
  const [filteredDelegados, setFilteredDelegados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Estados para cascada del formulario
  const [formDepto, setFormDepto] = useState('');
  const [formProv, setFormProv] = useState('');
  const [formMuni, setFormMuni] = useState('');
  const [formRecinto, setFormRecinto] = useState('');
  
  // Filtros
  const [filters, setFilters] = useState({
    departamento: '',
    provincia: '',
    municipio: '',
    recinto: '',
    organizacion: ''
  });

  // Catálogos
  const [catalogs, setCatalogs] = useState({
    orgs: {},
    deptos: {},
  });
  const [provs, setProvs] = useState({});
  const [munis, setMunis] = useState({});
  const [recintos, setRecintos] = useState({});
  const [mesas, setMesas] = useState({});
  
  // Catálogos para filtros
  const [filterProvs, setFilterProvs] = useState({});
  const [filterMunis, setFilterMunis] = useState({});
  const [filterRecintos, setFilterRecintos] = useState({});

  // Estado para búsqueda de recintos
  const [searchTermRecinto, setSearchTermRecinto] = useState('');

  // Estado para carga masiva
  const [archivoCargaMasiva, setArchivoCargaMasiva] = useState(null);
  const [cargaMasivaLoading, setCargaMasivaLoading] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [orgRes, deptoRes] = await Promise.all([
          api.get('/api/catalog?table=organizaciones_politicas'),
          api.get('/api/catalog?table=departamentos'),
        ]);
        setCatalogs({
          orgs: orgRes.data || {},
          deptos: deptoRes.data || {},
        });
        
        // Cargar delegados iniciales (solo rol Delegado = 6)
        const delRes = await api.get('/api/delegados/listar?id_rol=6');
        const data = delRes.data || [];
        setDelegados(data);
        setFilteredDelegados(data);
      } catch (err) {
        console.error('Error al cargar datos iniciales', err);
        alert('❌ Error al cargar datos: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Cargar delegados con filtros geográficos
  const loadDelegados = async (filtersToUse = filters, searchTermToUse = searchTerm) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtersToUse.departamento) params.append('departamento', filtersToUse.departamento);
      if (filtersToUse.provincia) params.append('provincia', filtersToUse.provincia);
      if (filtersToUse.municipio) params.append('municipio', filtersToUse.municipio);
      if (filtersToUse.recinto) params.append('recinto', filtersToUse.recinto);
      if (filtersToUse.organizacion) params.append('organizacion', filtersToUse.organizacion);
      
      const url = `/api/delegados/listar${params.toString() ? '?' + params.toString() : ''}`;
      const res = await api.get(url);
      const data = res.data || [];
      setDelegados(data);
      
      // Aplicar filtro de búsqueda local
      let filtered = data;
      if (searchTermToUse.trim()) {
        const term = searchTermToUse.toLowerCase();
        filtered = filtered.filter(d => 
          `${d.nombre} ${d.apellido}`.toLowerCase().includes(term) ||
          d.ci.includes(term)
        );
      }
      setFilteredDelegados(filtered);
    } catch (err) {
      console.error('Error al cargar delegados', err);
      alert('❌ Error al cargar delegados: ' + (err.response?.data?.detail || err.message));
      setDelegados([]);
      setFilteredDelegados([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar delegados cuando cambien los filtros o búsqueda
  useEffect(() => {
    loadDelegados(filters, searchTerm);
  }, [filters, searchTerm]);

  // ============ CASCADA PARA FORMULARIO ============
  const handleDeptoChange = async (idDepto) => {
    setFormDepto(idDepto);
    setFormProv('');
    setFormMuni('');
    setFormRecinto('');
    setFormData(prev => ({ ...prev, id_mesa: '' }));
    setProvs({}); setMunis({}); setRecintos({}); setMesas({});
    if (!idDepto) return;
    try {
      const res = await api.get(`/api/provincias/departamento/${idDepto}`);
      setProvs(res.data || {});
    } catch (err) {
      console.error('Error al cargar provincias', err);
    }
  };

  const handleProvChange = async (idProv) => {
    setFormProv(idProv);
    setFormMuni('');
    setFormRecinto('');
    setFormData(prev => ({ ...prev, id_mesa: '' }));
    setMunis({}); setRecintos({}); setMesas({});
    if (!idProv) return;
    try {
      const res = await api.get(`/api/municipios/provincia/${idProv}`);
      setMunis(res.data || {});
    } catch (err) {
      console.error('Error al cargar municipios', err);
    }
  };

  const handleMuniChange = async (idMuni) => {
    setFormMuni(idMuni);
    setFormRecinto('');
    setSearchTermRecinto(''); // Reiniciar búsqueda de recinto
    setFormData(prev => ({ ...prev, id_mesa: '' }));
    setRecintos({}); setMesas({});
    if (!idMuni) return;
    try {
      const res = await api.get(`/api/recintos/municipio/${idMuni}`);
      setRecintos(res.data || {});
    } catch (err) {
      console.error('Error al cargar recintos', err);
    }
  };

  const handleRecintoChange = async (idRecinto) => {
    setFormRecinto(idRecinto);
    setSearchTermRecinto(''); // Reiniciar búsqueda de recinto
    setFormData(prev => ({ ...prev, id_mesa: '' }));
    setMesas({});
    if (!idRecinto) return;
    try {
      const res = await api.get(`/api/mesas/recinto/${idRecinto}`);
      setMesas(res.data || {});
    } catch (err) {
      console.error('Error al cargar mesas', err);
    }
  };

  // ============ CASCADA PARA FILTROS ============
  const handleFilterDeptoChange = async (idDepto) => {
    setFilters(prev => ({ ...prev, departamento: idDepto, provincia: '', municipio: '', recinto: '' }));
    setFilterProvs({}); setFilterMunis({}); setFilterRecintos({});
    if (!idDepto) return;
    try {
      const res = await api.get(`/api/provincias/departamento/${idDepto}`);
      setFilterProvs(res.data || {});
    } catch (err) {
      console.error('Error al cargar provincias', err);
    }
  };

  const handleFilterProvChange = async (idProv) => {
    setFilters(prev => ({ ...prev, provincia: idProv, municipio: '', recinto: '' }));
    setFilterMunis({}); setFilterRecintos({});
    if (!idProv) return;
    try {
      const res = await api.get(`/api/municipios/provincia/${idProv}`);
      setFilterMunis(res.data || {});
    } catch (err) {
      console.error('Error al cargar municipios', err);
    }
  };

  const handleFilterMuniChange = async (idMuni) => {
    setFilters(prev => ({ ...prev, municipio: idMuni, recinto: '' }));
    setFilterRecintos({});
    if (!idMuni) return;
    try {
      const res = await api.get(`/api/recintos/municipio/${idMuni}`);
      setFilterRecintos(res.data || {});
    } catch (err) {
      console.error('Error al cargar recintos', err);
    }
  };

  const handleFilterRecintoChange = (idRecinto) => {
    setFilters(prev => ({ ...prev, recinto: idRecinto }));
  };

  // ============ SUBMIT CREAR/EDITAR ============
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.apellido || !formData.ci || !formData.id_mesa) {
      alert('❌ Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/api/delegados/${editingId}`, formData);
        alert('✅ Delegado actualizado exitosamente');
        setIsEditing(false);
        setEditingId(null);
      } else {
        const response = await api.post('/api/delegados', formData);
        const datos = response.data;
        
        // Mostrar credenciales si se creó un usuario
        if (datos.username && datos.password) {
          alert(
            `✅ Delegado registrado exitosamente.\n\n` +
            `📋 DATOS DE ACCESO:\n` +
            `👤 Usuario: ${datos.username}\n` +
            `🔑 Contraseña: ${datos.password}\n\n` +
            `⚠️ El delegado debe iniciar sesión en el sistema con estas credenciales.`
          );
        } else {
          alert('✅ Delegado registrado exitosamente');
        }
      }

      setFormData({
        nombre: '',
        apellido: '',
        ci: '',
        telefono: '',
        direccion: '',
        id_organizacion: '',
        id_mesa: '',
      });
      setFormDepto('');
      setFormProv('');
      setFormMuni('');
      setFormRecinto('');
      setSearchTermRecinto(''); // Reiniciar búsqueda de recinto
      setProvs({}); setMunis({}); setRecintos({}); setMesas({});
      loadDelegados();
    } catch (err) {
      console.error('Error', err);
      alert('❌ Error: ' + (err.response?.data?.detail || 'Algo salió mal'));
    } finally {
      setLoading(false);
    }
  };

  // ============ EDITAR ============
  const handleEdit = async (delegado) => {
    setIsEditing(true);
    setEditingId(delegado.id_delegado);
    setFormData({
      nombre: delegado.nombre,
      apellido: delegado.apellido,
      ci: delegado.ci,
      telefono: delegado.telefono,
      direccion: delegado.direccion,
      id_organizacion: delegado.id_organizacion,
      id_mesa: delegado.id_mesa,
    });

    // Establecer valores de cascada
    setFormDepto(delegado.id_departamento);
    setFormProv(delegado.id_provincia);
    setFormMuni(delegado.id_municipio);
    setFormRecinto(delegado.id_recinto);

    // Cargar datos de cascada para el formulario
    try {
      // Cargar provincias del departamento
      const provRes = await api.get(`/api/provincias/departamento/${delegado.id_departamento}`);
      setProvs(provRes.data || {});

      // Cargar municipios de la provincia
      const muniRes = await api.get(`/api/municipios/provincia/${delegado.id_provincia}`);
      setMunis(muniRes.data || {});

      // Cargar recintos del municipio
      const recRes = await api.get(`/api/recintos/municipio/${delegado.id_municipio}`);
      setRecintos(recRes.data || {});

      // Cargar mesas del recinto
      const mesasRes = await api.get(`/api/mesas/recinto/${delegado.id_recinto}`);
      setMesas(mesasRes.data || {});
    } catch (err) {
      console.error('Error al cargar datos de cascada', err);
    }

    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      nombre: '',
      apellido: '',
      ci: '',
      telefono: '',
      direccion: '',
      id_organizacion: '',
      id_mesa: '',
    });
    setFormDepto('');
    setFormProv('');
    setFormMuni('');
    setFormRecinto('');
    setSearchTermRecinto(''); // Reiniciar búsqueda de recinto
    setProvs({}); setMunis({}); setRecintos({}); setMesas({});
  };

  // ============ ELIMINAR ============
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este delegado? Esta acción también eliminará su usuario asociado.')) {
      setLoading(true);
      try {
        // El backend elimina tanto el delegado como el usuario asociado
        await api.delete(`/api/delegados/eliminar/${id}`);
        alert('✅ Delegado y usuario eliminados exitosamente');
        loadDelegados();
      } catch (err) {
        console.error('Error', err);
        alert('❌ Error al eliminar delegado: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  // ============ CARGA MASIVA ============
  const handleCargaMasiva = async () => {
    if (!archivoCargaMasiva) {
      alert('❌ Por favor selecciona un archivo Excel para cargar');
      return;
    }

    const formData = new FormData();
    formData.append('file', archivoCargaMasiva);

    setCargaMasivaLoading(true);
    try {
      const response = await api.post('/api/delegados/carga-masiva', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert(
        `✅ Carga masiva completada:\n\n` +
        `📊 Total registros: ${response.data.total_registros}\n` +
        `✅ Registros insertados: ${response.data.registros_insertados}\n` +
        `❌ Registros fallidos: ${response.data.registros_fallidos}\n\n` +
        `📝 Mensaje: ${response.data.message}`
      );

      // Limpiar el archivo seleccionado
      setArchivoCargaMasiva(null);
      document.getElementById('archivoCargaMasiva').value = '';

      // Recargar la lista de delegados
      loadDelegados();
    } catch (err) {
      console.error('Error en carga masiva', err);
      alert('❌ Error en la carga masiva: ' + (err.response?.data?.detail || err.message));
    } finally {
      setCargaMasivaLoading(false);
    }
  };

  const handleArchivoCargaMasivaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea un archivo Excel
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('❌ Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
      }
      setArchivoCargaMasiva(file);
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
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Delegados</h1>
            <p className="text-gray-600">Administra los delegados asignados a cada mesa de votación</p>
          </div>
        </div>

        {/* ============ FORMULARIO CREAR/EDITAR ============ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {isEditing ? 'Editar Delegado' : 'Registrar Nuevo Delegado'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre y Apellido */}
            <input
              type="text"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Apellido"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />

            {/* CI y Teléfono */}
            <input
              type="text"
              placeholder="Cédula de Identidad"
              value={formData.ci}
              onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {/* Dirección */}
            <input
              type="text"
              placeholder="Dirección"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 md:col-span-2"
              required
            />

            {/* Organización */}
            <select
              value={formData.id_organizacion}
              onChange={(e) => setFormData({ ...formData, id_organizacion: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona Organización</option>
              {Object.entries(catalogs.orgs).map(([sigla, id]) => (
                <option key={id} value={id}>{sigla}</option>
              ))}
            </select>

            {/* Cascada Geográfica */}
            <select
              value={formDepto}
              onChange={(e) => handleDeptoChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona Departamento</option>
              {Object.entries(catalogs.deptos).map(([nombre, id]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </select>

            <select
              value={formProv}
              onChange={(e) => handleProvChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={Object.keys(provs).length === 0}
            >
              <option value="">Selecciona Provincia</option>
              {Object.entries(provs).map(([nombre, id]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </select>

            <select
              value={formMuni}
              onChange={(e) => handleMuniChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={Object.keys(munis).length === 0}
            >
              <option value="">Selecciona Municipio</option>
              {Object.entries(munis).map(([nombre, id]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </select>

            {/* Campo de búsqueda para recintos */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar recinto..."
                value={searchTermRecinto}
                onChange={(e) => setSearchTermRecinto(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={Object.keys(recintos).length === 0}
              />
              <select
                value={formRecinto}
                onChange={(e) => handleRecintoChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                disabled={Object.keys(recintos).length === 0}
              >
                <option value="">Selecciona Recinto</option>
                {Object.entries(recintos)
                  .filter(([nombre, id]) => 
                    nombre.toLowerCase().includes(searchTermRecinto.toLowerCase())
                  )
                  .map(([nombre, id]) => (
                    <option key={id} value={id}>{nombre}</option>
                  ))}
              </select>
            </div>

            <select
              value={formData.id_mesa}
              onChange={(e) => setFormData({ ...formData, id_mesa: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={Object.keys(mesas).length === 0}
              required
            >
              <option value="">Selecciona Mesa</option>
              {Object.entries(mesas).map(([numero, id]) => (
                <option key={id} value={id}>Mesa #{numero}</option>
              ))}
            </select>

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

        {/* ============ FILTROS ============ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Búsqueda */}
            <input
              type="text"
              placeholder="Buscar por nombre o CI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 lg:col-span-2"
            />

            {/* Filtros Geográficos */}
            <select
              value={filters.departamento}
              onChange={(e) => handleFilterDeptoChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los Departamentos</option>
              {Object.entries(catalogs.deptos).map(([nombre, id]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </select>

            <select
              value={filters.provincia}
              onChange={(e) => handleFilterProvChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!filters.departamento}
            >
              <option value="">Todas las Provincias</option>
              {Object.entries(filterProvs).map(([prov, id]) => (
                <option key={id} value={id}>{prov}</option>
              ))}
            </select>

            <select
              value={filters.municipio}
              onChange={(e) => handleFilterMuniChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!filters.provincia}
            >
              <option value="">Todos los Municipios</option>
              {Object.entries(filterMunis).map(([muni, id]) => (
                <option key={id} value={id}>{muni}</option>
              ))}
            </select>

            <select
              value={filters.recinto}
              onChange={(e) => handleFilterRecintoChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!filters.municipio}
            >
              <option value="">Todos los Recintos</option>
              {Object.entries(filterRecintos).map(([recinto, id]) => (
                <option key={id} value={id}>{recinto}</option>
              ))}
            </select>

            <select
              value={filters.organizacion}
              onChange={(e) => setFilters({ ...filters, organizacion: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las Organizaciones</option>
              {Object.entries(catalogs.orgs).map(([sigla, id]) => (
                <option key={id} value={id}>{sigla}</option>
              ))}
            </select>

            {/* Botón Limpiar */}
            <button
              onClick={() => {
                setFilters({
                  departamento: '',
                  provincia: '',
                  municipio: '',
                  recinto: '',
                  organizacion: ''
                });
                setSearchTerm('');
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* ============ CARGA MASIVA ============ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Carga Masiva de Delegados</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecciona archivo Excel con delegados
              </label>
              <input
                type="file"
                id="archivoCargaMasiva"
                accept=".xlsx,.xls"
                onChange={handleArchivoCargaMasivaChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                El archivo debe contener las columnas: nombre, apellido, ci, telefono, direccion, id_organizacion, id_mesa
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <button
                onClick={handleCargaMasiva}
                disabled={cargaMasivaLoading || !archivoCargaMasiva}
                className={`w-full sm:w-auto px-6 py-2 rounded-lg font-medium ${
                  cargaMasivaLoading || !archivoCargaMasiva
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {cargaMasivaLoading ? 'Cargando...' : 'Cargar Archivo'}
              </button>
            </div>
          </div>
        </div>

        {/* ============ TABLA DE DELEGADOS ============ */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-800">
              Delegados Registrados ({filteredDelegados.length})
            </h2>
          </div>
          
          {loading && <div className="p-4 text-center text-gray-600">Cargando...</div>}
          
          {!loading && filteredDelegados.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No hay delegados que mostrar</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Nombre</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">CI</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Teléfono</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Dirección</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Organización</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Rol</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Departamento</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Provincia</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Municipio</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Recinto</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Mesa</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDelegados.map((delegado) => (
                    <tr key={delegado.id_delegado} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{delegado.nombre} {delegado.apellido}</td>
                      <td className="px-6 py-4 text-sm font-mono">{delegado.ci}</td>
                      <td className="px-6 py-4 text-sm">{delegado.telefono || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{delegado.direccion}</td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">{delegado.organizacion_sigla}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {delegado.nombre_rol || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{delegado.departamento}</td>
                      <td className="px-6 py-4 text-sm">{delegado.provincia}</td>
                      <td className="px-6 py-4 text-sm">{delegado.municipio}</td>
                      <td className="px-6 py-4 text-sm">{delegado.recinto}</td>
                      <td className="px-6 py-4 text-sm font-bold">#{delegado.numero_mesa}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleEdit(delegado)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded mr-2"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(delegado.id_delegado)}
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