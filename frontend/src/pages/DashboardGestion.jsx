// frontend/src/pages/DashboardGestion.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DashboardGestion() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [gestionData, setGestionData] = useState(null);
  const [activeTab, setActiveTab] = useState('resumen');
  const [coordinadoresRecinto, setCoordinadoresRecinto] = useState([]);
  const [coordinadoresDistrito, setCoordinadoresDistrito] = useState([]);
  const [editingCoordId, setEditingCoordId] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [searchCoord, setSearchCoord] = useState('');
  
  // Catálogos geográficos para edición
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [recintos, setRecintos] = useState([]);

  // Filtros geográficos
  const [filtros, setFiltros] = useState({
    id_departamento: '',
    id_provincia: '',
    id_municipio: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.nombre_rol || '');
      setUserName(user.nombre || user.username || 'Usuario');
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDepartamentos();
  }, []);

  useEffect(() => {
    loadGestionData();
    loadCoordinadores();
  }, [filtros]);

  const loadCoordinadores = async () => {
    try {
      // Cargar coordinadores de recinto (id_rol=5)
      const responseRecinto = await api.get('/api/delegados/listar?id_rol=5');
      setCoordinadoresRecinto(responseRecinto.data || []);
      
      // Cargar coordinadores de distrito (id_rol=4)
      const responseDistrito = await api.get('/api/delegados/listar?id_rol=4');
      setCoordinadoresDistrito(responseDistrito.data || []);
      
      // Cargar catálogos geográficos
      const deptosRes = await api.get('/api/catalog?table=departamentos');
      setDepartamentos(Object.entries(deptosRes.data).map(([nombre, id]) => ({ id, nombre })));
    } catch (error) {
      console.error('Error al cargar coordinadores:', error);
    }
  };

  const loadProvincias = async (idDepartamento) => {
    try {
      const response = await api.get(`/api/provincias/departamento/${idDepartamento}`);
      const provs = Object.entries(response.data || {}).map(([nombre, id]) => ({ id, nombre }));
      setProvincias(provs);
      setMunicipios([]);
      setRecintos([]);
    } catch (error) {
      console.error('Error al cargar provincias:', error);
      setProvincias([]);
    }
  };

  const loadMunicipios = async (idProvincia) => {
    try {
      const response = await api.get(`/api/municipios/provincia/${idProvincia}`);
      const munis = Object.entries(response.data || {}).map(([nombre, id]) => ({ id, nombre }));
      setMunicipios(munis);
      setRecintos([]);
    } catch (error) {
      console.error('Error al cargar municipios:', error);
      setMunicipios([]);
    }
  };

  const loadRecintos = async (idMunicipio) => {
    try {
      const response = await api.get(`/api/recintos/municipio/${idMunicipio}`);
      const recs = Object.entries(response.data || {}).map(([nombre, id]) => ({ id, nombre }));
      setRecintos(recs);
    } catch (error) {
      console.error('Error al cargar recintos:', error);
      setRecintos([]);
    }
  };

  const handleEditCoord = (coord) => {
    setEditingCoordId(coord.id_delegado);
    setEditFormData({
      nombre: coord.nombre,
      apellido: coord.apellido,
      ci: coord.ci,
      telefono: coord.telefono || '',
      direccion: coord.direccion || '',
      id_rol: 5,
      id_recinto: coord.id_recinto || '',
      id_departamento: coord.id_departamento || '',
      id_provincia: coord.id_provincia || '',
      id_municipio: coord.id_municipio || ''
    });
    
    // Cargar cascada geográfica
    if (coord.id_departamento) {
      loadProvincias(coord.id_departamento);
      if (coord.id_provincia) {
        loadMunicipios(coord.id_provincia);
        if (coord.id_municipio) {
          loadRecintos(coord.id_municipio);
        }
      }
    }
  };

  const handleSaveCoord = async (idDelegado) => {
    try {
      await api.put(`/api/delegados/${idDelegado}`, editFormData);
      alert('✅ Coordinador actualizado exitosamente');
      setEditingCoordId(null);
      loadCoordinadores();
    } catch (error) {
      alert('❌ Error al actualizar: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCancelEdit = () => {
    setEditingCoordId(null);
    setEditFormData(null);
  };

  // Filtrar coordinadores por búsqueda
  const coordinadoresFiltrados = coordinadoresRecinto?.filter(coord => {
    if (!searchCoord?.trim()) return true;
    const term = searchCoord.toLowerCase();
    return (
      coord.nombre?.toLowerCase().includes(term) ||
      coord.apellido?.toLowerCase().includes(term) ||
      coord.ci?.includes(term) ||
      (coord.recinto && coord.recinto.toLowerCase().includes(term)) ||
      (coord.municipio && coord.municipio.toLowerCase().includes(term))
    );
  }) || [];

  const loadDepartamentos = async () => {
    try {
      const response = await api.get('/api/departamentos');
      const deptos = Object.entries(response.data).map(([nombre, id]) => ({ id, nombre }));
      setDepartamentos(deptos);
    } catch (error) {
      console.error('Error al cargar departamentos:', error);
    }
  };

  const loadGestionData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtros.id_departamento) params.id_departamento = filtros.id_departamento;
      if (filtros.id_provincia) params.id_provincia = filtros.id_provincia;
      if (filtros.id_municipio) params.id_municipio = filtros.id_municipio;

      const response = await api.get('/api/dashboard/gestion-recintos', { params });
      console.log('Datos de gestión cargados:', response.data);
      setGestionData(response.data);
    } catch (error) {
      console.error('Error al cargar datos de gestión:', error);
      alert('Error al cargar datos de gestión: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDepartamentoChange = async (e) => {
    const idDepartamento = e.target.value;
    setFiltros({
      ...filtros,
      id_departamento: idDepartamento,
      id_provincia: '',
      id_municipio: ''
    });
    if (idDepartamento) {
      await loadProvincias(idDepartamento);
    } else {
      setProvincias([]);
      setMunicipios([]);
    }
  };

  const handleProvinciaChange = async (e) => {
    const idProvincia = e.target.value;
    setFiltros({
      ...filtros,
      id_provincia: idProvincia,
      id_municipio: ''
    });
    if (idProvincia) {
      await loadMunicipios(idProvincia);
    } else {
      setMunicipios([]);
    }
  };

  const handleMunicipioChange = (e) => {
    setFiltros({
      ...filtros,
      id_municipio: e.target.value
    });
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      id_departamento: '',
      id_provincia: '',
      id_municipio: ''
    });
    setProvincias([]);
    setMunicipios([]);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
    navigate('/login');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const ProgressBar = ({ value, max, colorClass, showLabel = true }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
      <div className="w-full">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/70">{value} de {max}</span>
          {showLabel && <span className="text-white/70">{percentage.toFixed(1)}%</span>}
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, total, icon, gradient, subtitle }) => {
    const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
    const missing = total - value;

    return (
      <div className={`relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">{icon}</span>
            <span className="text-3xl font-bold">{value}</span>
          </div>
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          {total !== undefined && (
            <>
              <p className="text-sm text-white/80 mb-2">
                Total: {total} | Faltantes: <span className="font-bold text-yellow-300">{missing}</span>
              </p>
              <ProgressBar value={value} max={total} colorClass="bg-white/60" />
            </>
          )}
          {subtitle && <p className="text-xs text-white/60 mt-2">{subtitle}</p>}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'resumen', label: '📊 Resumen', icon: '📊' },
    { id: 'recintos', label: '🏢 Recintos', icon: '🏢' },
    { id: 'coordinadores', label: '👥 Coord. Recinto', icon: '👥' },
    { id: 'coordinadores_distrito', label: '🗺️ Coord. Distrito', icon: '🗺️' },
    { id: 'delegados', label: '🎯 Delegados', icon: '🎯' },
    { id: 'faltantes', label: '⚠️ Faltantes', icon: '⚠️' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-white text-lg">Cargando datos de gestión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Panel de Gestión</h1>
                <button
                  onClick={() => navigate('/gestion-roles')}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-lg hover:from-orange-700 hover:to-pink-700 font-medium transition-all duration-300 shadow-lg hover:shadow-orange-500/30 flex items-center gap-2 text-sm"
                  title="Gestionar roles de delegados"
                >
                  <span>🔄</span>
                  <span>Gestión de Roles</span>
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-red-500 rounded-xl flex items-center justify-center text-2xl shadow-lg animate-pulse">
                  🇧🇴
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Gestión de Recintos y Delegados
                  </h1>
                  <p className="text-sm text-purple-200">Panel de Control y Avance</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-white font-semibold">{userName}</p>
                  <p className="text-xs text-purple-300 capitalize">{userRole || 'Usuario'}</p>
                  <p className="text-xs text-purple-400">{formatTime(currentTime)}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="group px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-red-500/50 flex items-center gap-2"
                >
                  <span className="group-hover:rotate-12 transition-transform duration-300">🚪</span>
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filtros Geográficos */}
          <div className="mb-6 p-5 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🗺️</span>
              <h3 className="text-lg font-bold text-white">Filtros Geográficos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-purple-200 mb-1.5">Departamento</label>
                <select
                  value={filtros.id_departamento}
                  onChange={handleDepartamentoChange}
                  className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Todos los departamentos</option>
                  {departamentos.map((depto) => (
                    <option key={depto.id} value={depto.id} className="text-slate-900">
                      {depto.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-purple-200 mb-1.5">Provincia</label>
                <select
                  value={filtros.id_provincia}
                  onChange={handleProvinciaChange}
                  disabled={!filtros.id_departamento}
                  className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Todas las provincias</option>
                  {provincias.map((prov) => (
                    <option key={prov.id} value={prov.id} className="text-slate-900">
                      {prov.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-purple-200 mb-1.5">Municipio</label>
                <select
                  value={filtros.id_municipio}
                  onChange={handleMunicipioChange}
                  disabled={!filtros.id_provincia}
                  className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Todos los municipios</option>
                  {municipios.map((muni) => (
                    <option key={muni.id} value={muni.id} className="text-slate-900">
                      {muni.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleLimpiarFiltros}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                >
                  <span>🧹</span>
                  <span>Limpiar Filtros</span>
                </button>
              </div>
            </div>
            {(filtros.id_departamento || filtros.id_provincia || filtros.id_municipio) && (
              <div className="mt-4 flex items-center gap-2 text-xs text-purple-300">
                <span>✅</span>
                <span>Filtros activos: </span>
                {filtros.id_departamento && (
                  <span className="px-2 py-1 bg-purple-500/20 rounded-lg border border-purple-500/30">
                    {departamentos.find(d => d.id == filtros.id_departamento)?.nombre}
                  </span>
                )}
                {filtros.id_provincia && (
                  <span className="px-2 py-1 bg-purple-500/20 rounded-lg border border-purple-500/30">
                    {provincias.find(p => p.id == filtros.id_provincia)?.nombre}
                  </span>
                )}
                {filtros.id_municipio && (
                  <span className="px-2 py-1 bg-purple-500/20 rounded-lg border border-purple-500/30">
                    {municipios.find(m => m.id == filtros.id_municipio)?.nombre}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Resumen Tab */}
          {activeTab === 'resumen' && gestionData && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                  title="Recintos con Coordinador"
                  value={gestionData.recintos_con_coordinador}
                  total={gestionData.total_recintos}
                  icon="🏢"
                  gradient="from-blue-600 to-cyan-600"
                />
                <StatCard
                  title="Coordinadores Registrados"
                  value={gestionData.total_coordinadores}
                  icon="👥"
                  gradient="from-purple-600 to-pink-600"
                  subtitle="Total de coordinadores de recinto"
                />
                <StatCard
                  title="Mesas con Delegado"
                  value={gestionData.mesas_con_delegado}
                  total={gestionData.total_mesas}
                  icon="🎯"
                  gradient="from-green-600 to-emerald-600"
                />
                <StatCard
                  title="Delegados Registrados"
                  value={gestionData.total_delegados}
                  icon="📋"
                  gradient="from-orange-600 to-red-600"
                  subtitle="Total de delegados de mesa"
                />
              </div>

              {/* Overall Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recintos Progress */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🏢</span>
                    Avance de Recintos
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/70">Recintos Cubiertos</span>
                        <span className="text-white font-semibold">
                          {gestionData.porcentaje_recintos_cubiertos}%
                        </span>
                      </div>
                      <ProgressBar
                        value={gestionData.recintos_con_coordinador}
                        max={gestionData.total_recintos}
                        colorClass="bg-gradient-to-r from-blue-500 to-cyan-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                        <p className="text-green-300 text-xs">Con Coordinador</p>
                        <p className="text-2xl font-bold text-green-400">
                          {gestionData.recintos_con_coordinador}
                        </p>
                      </div>
                      <div className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-500/30">
                        <p className="text-yellow-300 text-xs">Sin Coordinador</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          {gestionData.recintos_sin_coordinador}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mesas Progress */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Avance de Mesas
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/70">Mesas Cubiertas</span>
                        <span className="text-white font-semibold">
                          {gestionData.porcentaje_mesas_cubiertas}%
                        </span>
                      </div>
                      <ProgressBar
                        value={gestionData.mesas_con_delegado}
                        max={gestionData.total_mesas}
                        colorClass="bg-gradient-to-r from-green-500 to-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                        <p className="text-green-300 text-xs">Con Delegado</p>
                        <p className="text-2xl font-bold text-green-400">
                          {gestionData.mesas_con_delegado}
                        </p>
                      </div>
                      <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
                        <p className="text-red-300 text-xs">Sin Delegado</p>
                        <p className="text-2xl font-bold text-red-400">
                          {gestionData.mesas_sin_delegado}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-lg rounded-2xl border border-indigo-500/30 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📊</span>
                    <h4 className="text-lg font-semibold text-white">Totales Generales</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Total Recintos:</span>
                      <span className="text-white font-semibold">{gestionData.total_recintos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Total Mesas:</span>
                      <span className="text-white font-semibold">{gestionData.total_mesas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Total Coordinadores:</span>
                      <span className="text-white font-semibold">{gestionData.total_coordinadores}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Total Delegados:</span>
                      <span className="text-white font-semibold">{gestionData.total_delegados}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 backdrop-blur-lg rounded-2xl border border-green-500/30 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">✅</span>
                    <h4 className="text-lg font-semibold text-white">Avances Positivos</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Recintos cubiertos:</span>
                      <span className="text-green-400 font-semibold">
                        {gestionData.recintos_con_coordinador}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Mesas cubiertas:</span>
                      <span className="text-green-400 font-semibold">
                        {gestionData.mesas_con_delegado}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">% Recintos:</span>
                      <span className="text-green-400 font-semibold">
                        {gestionData.porcentaje_recintos_cubiertos}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">% Mesas:</span>
                      <span className="text-green-400 font-semibold">
                        {gestionData.porcentaje_mesas_cubiertas}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-600/30 to-orange-600/30 backdrop-blur-lg rounded-2xl border border-yellow-500/30 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">⚠️</span>
                    <h4 className="text-lg font-semibold text-white">Faltantes</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Recintos sin coord.:</span>
                      <span className="text-yellow-400 font-semibold">
                        {gestionData.recintos_sin_coordinador}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Mesas sin delegado:</span>
                      <span className="text-yellow-400 font-semibold">
                        {gestionData.mesas_sin_delegado}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Faltan recintos:</span>
                      <span className="text-yellow-400 font-semibold">
                        {((100 - gestionData.porcentaje_recintos_cubiertos)).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Faltan mesas:</span>
                      <span className="text-yellow-400 font-semibold">
                        {(100 - gestionData.porcentaje_mesas_cubiertas).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recintos Tab */}
          {activeTab === 'recintos' && gestionData && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">🏢</span>
                  Todos los Recintos
                </h2>
                <p className="text-purple-200 mt-1">
                  Listado completo de recintos ({gestionData.recintos_detalle?.length || 0})
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">Recinto</th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">Dirección</th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">Zona</th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">Municipio</th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">Coordinador</th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">CI</th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">Teléfono</th>
                      <th className="py-4 px-4 text-center text-sm font-semibold text-purple-200">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!gestionData.recintos_detalle || gestionData.recintos_detalle.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-8 text-purple-200">
                          No hay recintos registrados
                        </td>
                      </tr>
                    ) : (
                      gestionData.recintos_detalle.map((recinto, idx) => (
                        <tr
                          key={recinto.id_recinto}
                          className={`border-b border-white/10 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-white/5' : ''}`}
                        >
                          <td className="py-3 px-4 text-white font-semibold">{recinto.recinto_nombre}</td>
                          <td className="py-3 px-4 text-purple-200">{recinto.direccion || '—'}</td>
                          <td className="py-3 px-4 text-purple-200">{recinto.zona || '—'}</td>
                          <td className="py-3 px-4 text-purple-200">
                            {recinto.municipio}, {recinto.provincia}
                          </td>
                          <td className="py-3 px-4 text-white">
                            {recinto.coord_nombre ? `${recinto.coord_nombre} ${recinto.coord_apellido}` : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-purple-200">{recinto.coord_ci || '—'}</td>
                          <td className="py-3 px-4 text-purple-200">{recinto.coord_telefono || '—'}</td>
                          <td className="py-3 px-4 text-center">
                            {recinto.coord_nombre ? (
                              <span className="px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-300 rounded-lg text-xs font-medium border border-green-500/30">
                                ✅ Asignado
                              </span>
                            ) : (
                              <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-600/20 text-yellow-300 rounded-lg text-xs font-medium border border-yellow-500/30">
                                ⚠️ Sin Coordinador
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Coordinadores Recinto Tab */}
          {activeTab === 'coordinadores' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="text-3xl">👥</span>
                      Coordinadores de Recinto
                    </h2>
                    <p className="text-purple-200 mt-1">
                      Listado de coordinadores ({coordinadoresFiltrados.length} de {coordinadoresRecinto.length})
                    </p>
                  </div>
                  <input
                    type="text"
                    value={searchCoord}
                    onChange={(e) => setSearchCoord(e.target.value)}
                    placeholder="🔍 Buscar por nombre, CI, recinto..."
                    className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 w-80"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-purple-200">Nombre</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-purple-200">CI</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-purple-200">Teléfono</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-purple-200">Departamento</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-purple-200">Provincia</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-purple-200">Municipio</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-purple-200">Recinto</th>
                      <th className="py-3 px-4 text-center text-sm font-semibold text-purple-200">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coordinadoresFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-purple-200">
                          {searchCoord ? 'No se encontraron coordinadores' : 'No hay coordinadores de recinto registrados'}
                        </td>
                      </tr>
                    ) : (
                      coordinadoresFiltrados.map((coord, idx) => (
                        <tr
                          key={coord.id_delegado}
                          className={`border-b border-white/10 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-white/5' : ''}`}
                        >
                          {editingCoordId === coord.id_delegado ? (
                            // Modo edición
                            <>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={editFormData.nombre}
                                  onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})}
                                  className="w-full p-1 bg-white/20 border border-white/30 rounded text-white text-sm"
                                />
                              </td>
                              <td className="py-3 px-4 font-mono text-purple-200">{editFormData.ci}</td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={editFormData.telefono}
                                  onChange={(e) => setEditFormData({...editFormData, telefono: e.target.value})}
                                  className="w-full p-1 bg-white/20 border border-white/30 rounded text-white text-sm"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={editFormData.id_departamento}
                                  onChange={(e) => {
                                    const idDepto = e.target.value;
                                    setEditFormData({...editFormData, id_departamento: idDepto, id_provincia: '', id_municipio: '', id_recinto: ''});
                                    loadProvincias(idDepto);
                                  }}
                                  className="w-full p-1 bg-white/20 border border-white/30 rounded text-white text-sm"
                                >
                                  <option value="">Seleccione...</option>
                                  {departamentos.map(depto => (
                                    <option key={depto.id} value={depto.id}>{depto.nombre}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={editFormData.id_provincia}
                                  onChange={(e) => {
                                    const idProv = e.target.value;
                                    setEditFormData({...editFormData, id_provincia: idProv, id_municipio: '', id_recinto: ''});
                                    loadMunicipios(idProv);
                                  }}
                                  disabled={!editFormData.id_departamento}
                                  className="w-full p-1 bg-white/20 border border-white/30 rounded text-white text-sm disabled:opacity-50"
                                >
                                  <option value="">Seleccione...</option>
                                  {provincias.map(prov => (
                                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={editFormData.id_municipio}
                                  onChange={(e) => {
                                    const idMuni = e.target.value;
                                    setEditFormData({...editFormData, id_municipio: idMuni, id_recinto: ''});
                                    loadRecintos(idMuni);
                                  }}
                                  disabled={!editFormData.id_provincia}
                                  className="w-full p-1 bg-white/20 border border-white/30 rounded text-white text-sm disabled:opacity-50"
                                >
                                  <option value="">Seleccione...</option>
                                  {municipios.map(muni => (
                                    <option key={muni.id} value={muni.id}>{muni.nombre}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={editFormData.id_recinto}
                                  onChange={(e) => setEditFormData({...editFormData, id_recinto: e.target.value})}
                                  disabled={!editFormData.id_municipio}
                                  className="w-full p-1 bg-white/20 border border-white/30 rounded text-white text-sm disabled:opacity-50"
                                >
                                  <option value="">Seleccione...</option>
                                  {recintos.map(rec => (
                                    <option key={rec.id} value={rec.id}>{rec.nombre}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleSaveCoord(coord.id_delegado)}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
                                  >
                                    💾 Guardar
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium"
                                  >
                                    ❌ Cancelar
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // Modo visualización
                            <>
                              <td className="py-3 px-4 text-white">{coord.nombre} {coord.apellido}</td>
                              <td className="py-3 px-4 font-mono text-purple-200">{coord.ci}</td>
                              <td className="py-3 px-4 text-purple-200">{coord.telefono || '—'}</td>
                              <td className="py-3 px-4 text-purple-200">{coord.departamento || '—'}</td>
                              <td className="py-3 px-4 text-purple-200">{coord.provincia || '—'}</td>
                              <td className="py-3 px-4 text-purple-200">{coord.municipio || '—'}</td>
                              <td className="py-3 px-4 text-white font-semibold">{coord.recinto || '—'}</td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleEditCoord(coord)}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                                >
                                  ✏️ Editar
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Coordinadores Distrito Tab */}
          {activeTab === 'coordinadores_distrito' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">🗺️</span>
                  Coordinadores de Distrito
                </h2>
                <p className="text-purple-200 mt-1">
                  Listado de todos los coordinadores de distrito registrados ({coordinadoresDistrito.length})
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">Nombre</th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">Apellido</th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">CI</th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">Teléfono</th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">Distrito</th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-purple-200">Dirección</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coordinadoresDistrito.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-purple-200">
                          No hay coordinadores de distrito registrados
                        </td>
                      </tr>
                    ) : (
                      coordinadoresDistrito.map((coord, idx) => (
                        <tr
                          key={coord.id_delegado}
                          className={`border-b border-white/10 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-white/5' : ''}`}
                        >
                          <td className="py-3 px-4 text-white">{coord.nombre}</td>
                          <td className="py-3 px-4 text-white">{coord.apellido}</td>
                          <td className="py-3 px-4 font-mono text-purple-200">{coord.ci}</td>
                          <td className="py-3 px-4 text-purple-200">{coord.telefono || '—'}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded text-xs font-medium">
                              Distrito {coord.nro_distrito || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-purple-200">{coord.direccion || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delegados Tab */}
          {activeTab === 'delegados' && gestionData && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">🎯</span>
                  Delegados por Mesa
                </h2>
                <p className="text-purple-200 mt-1">
                  Resumen de mesas con delegado asignado
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                    <p className="text-green-300 text-xs">Mesas con Delegado</p>
                    <p className="text-3xl font-bold text-green-400">{gestionData.mesas_con_delegado}</p>
                  </div>
                  <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
                    <p className="text-red-300 text-xs">Mesas sin Delegado</p>
                    <p className="text-3xl font-bold text-red-400">{gestionData.mesas_sin_delegado}</p>
                  </div>
                  <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                    <p className="text-blue-300 text-xs">Total Mesas</p>
                    <p className="text-3xl font-bold text-blue-400">{gestionData.total_mesas}</p>
                  </div>
                </div>
                <p className="text-purple-200 text-sm">
                  Para ver el detalle de delegados por organización, visita la página de Delegados.
                </p>
              </div>
            </div>
          )}

          {/* Faltantes Tab */}
          {activeTab === 'faltantes' && gestionData && (
            <div className="space-y-6">
              {/* Recintos sin Coordinador */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-yellow-500/10">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-3xl">⚠️</span>
                    Recintos sin Coordinador
                  </h2>
                  <p className="text-yellow-200 mt-1">
                    {gestionData.recintos_sin_coordinador} recintos requieren coordinador
                  </p>
                </div>
                {gestionData.recintos_sin_coordinador_detalle.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-green-300 text-lg">¡Todos los recintos tienen coordinador!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-yellow-200">Recinto</th>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-yellow-200">Dirección</th>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-yellow-200">Zona</th>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-yellow-200">Municipio</th>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-yellow-200">Provincia</th>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-yellow-200">Departamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gestionData.recintos_sin_coordinador_detalle.map((recinto, idx) => (
                          <tr
                            key={recinto.id_recinto}
                            className={`border-b border-white/10 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-white/5' : ''}`}
                          >
                            <td className="py-3 px-4 text-white font-semibold">{recinto.recinto_nombre}</td>
                            <td className="py-3 px-4 text-yellow-200">{recinto.direccion || '—'}</td>
                            <td className="py-3 px-4 text-yellow-200">{recinto.zona || '—'}</td>
                            <td className="py-3 px-4 text-yellow-200">{recinto.municipio}</td>
                            <td className="py-3 px-4 text-yellow-200">{recinto.provincia}</td>
                            <td className="py-3 px-4 text-yellow-200">{recinto.departamento}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Mesas sin Delegado */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-red-500/10">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-3xl">🔴</span>
                    Mesas sin Delegado
                  </h2>
                  <p className="text-red-200 mt-1">
                    {gestionData.mesas_sin_delegado} mesas requieren delegado
                  </p>
                </div>
                {gestionData.mesas_sin_delegado_detalle.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-green-300 text-lg">¡Todas las mesas tienen delegado!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-red-200">Número Mesa</th>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-red-200">Inscritos</th>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-red-200">Recinto</th>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-red-200">Municipio</th>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-red-200">Provincia</th>
                          <th className="py-4 px-4 text-left text-sm font-semibold text-red-200">Departamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gestionData.mesas_sin_delegado_detalle.map((mesa, idx) => (
                          <tr
                            key={mesa.id_mesa}
                            className={`border-b border-white/10 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-white/5' : ''}`}
                          >
                            <td className="py-3 px-4 text-white font-semibold">Mesa {mesa.numero_mesa}</td>
                            <td className="py-3 px-4 text-red-200">{mesa.cantidad_inscritos || '—'}</td>
                            <td className="py-3 px-4 text-red-200">{mesa.recinto}</td>
                            <td className="py-3 px-4 text-red-200">{mesa.municipio}</td>
                            <td className="py-3 px-4 text-red-200">{mesa.provincia}</td>
                            <td className="py-3 px-4 text-red-200">{mesa.departamento}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-purple-300 text-sm">
              © 2026 Sistema Electoral Bolivia - Gestión de Recintos y Delegados
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center gap-2 mx-auto"
            >
              <span>↩️</span>
              <span>Volver al Dashboard</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
