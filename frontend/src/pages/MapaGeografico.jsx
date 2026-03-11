// frontend/src/pages/MapaGeografico.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Componente para actualizar el centro del mapa
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Componente para hacer zoom en un recinto específico
function ZoomToRecinto({ recintoParaZoom }) {
  const map = useMap();
  useEffect(() => {
    if (recintoParaZoom && recintoParaZoom.latitud && recintoParaZoom.longitud) {
      map.flyTo([recintoParaZoom.latitud, recintoParaZoom.longitud], recintoParaZoom.zoom, {
        duration: 1.5
      });
    }
  }, [recintoParaZoom, map]);
  return null;
}

// Componente para ajustar el mapa a todos los recintos
function FitBoundsToRecintos({ recintos }) {
  const map = useMap();
  useEffect(() => {
    if (recintos && recintos.length > 0) {
      // Calcular los límites (bounds) de todos los recintos
      const latitudes = recintos.map(r => r.latitud);
      const longitudes = recintos.map(r => r.longitud);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      // Crear bounds y ajustar el mapa con padding
      const bounds = [[minLat, minLng], [maxLat, maxLng]];
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [recintos, map]);
  return null;
}

export default function MapaGeografico() {
  const navigate = useNavigate();

  // Estados para selección geográfica
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [recintos, setRecintos] = useState([]);
  const [localidades, setLocalidades] = useState([]);

  // Selección actual
  const [seleccion, setSeleccion] = useState({
    id_departamento: '',
    id_provincia: '',
    id_municipio: '',
    id_recinto: '',
    id_localidad: ''
  });

  // Búsqueda de recinto
  const [busquedaRecinto, setBusquedaRecinto] = useState('');
  const [recintosFiltrados, setRecintosFiltrados] = useState([]);

  // Datos del recinto seleccionado
  const [recintoSeleccionado, setRecintoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Mapa de todos los recintos
  const [mostrarMapaRecintos, setMostrarMapaRecintos] = useState(false);
  const [recintosConCoordenadas, setRecintosConCoordenadas] = useState([]);
  const [loadingMapa, setLoadingMapa] = useState(false);
  const [recintoParaZoom, setRecintoParaZoom] = useState(null);

  // Función para hacer zoom en un recinto específico
  const hacerZoomEnRecinto = (recinto) => {
    setRecintoParaZoom({
      latitud: recinto.latitud,
      longitud: recinto.longitud,
      zoom: 16
    });
  };

  // Cargar departamentos al iniciar
  useEffect(() => {
    const cargarDepartamentos = async () => {
      try {
        const res = await api.get('/api/catalog?table=departamentos');
        setDepartamentos(Object.entries(res.data).map(([nombre, id]) => ({ id, nombre })));
      } catch (err) {
        console.error('Error al cargar departamentos', err);
        setError('❌ Error al cargar departamentos');
      }
    };
    cargarDepartamentos();
  }, []);

  // Cargar provincias cuando cambia departamento
  useEffect(() => {
    if (seleccion.id_departamento) {
      api.get(`/api/provincias/departamento/${seleccion.id_departamento}`)
        .then(res => {
          setProvincias(Object.entries(res.data).map(([nombre, id]) => ({ id, nombre })));
          setSeleccion(prev => ({ ...prev, id_provincia: '', id_municipio: '', id_recinto: '', id_localidad: '' }));
          setMunicipios([]);
          setRecintos([]);
          setLocalidades([]);
          setRecintoSeleccionado(null);
        })
        .catch(err => console.error('Error al cargar provincias', err));
    }
  }, [seleccion.id_departamento]);

  // Cargar municipios cuando cambia provincia
  useEffect(() => {
    if (seleccion.id_provincia) {
      api.get(`/api/municipios/provincia/${seleccion.id_provincia}`)
        .then(res => {
          setMunicipios(Object.entries(res.data).map(([nombre, id]) => ({ id, nombre })));
          setSeleccion(prev => ({ ...prev, id_municipio: '', id_recinto: '', id_localidad: '' }));
          setRecintos([]);
          setLocalidades([]);
          setRecintoSeleccionado(null);
        })
        .catch(err => console.error('Error al cargar municipios', err));
    }
  }, [seleccion.id_provincia]);

  // Cargar recintos cuando cambia municipio
  useEffect(() => {
    if (seleccion.id_municipio) {
      api.get(`/api/recintos/municipio/${seleccion.id_municipio}`)
        .then(res => {
          const recintosData = Object.entries(res.data).map(([nombre, id]) => ({ id, nombre }));
          setRecintos(recintosData);
          setRecintosFiltrados(recintosData);
          setSeleccion(prev => ({ ...prev, id_recinto: '', id_localidad: '' }));
          setLocalidades([]);
          setRecintoSeleccionado(null);
          setBusquedaRecinto('');
        })
        .catch(err => console.error('Error al cargar recintos', err));
    }
  }, [seleccion.id_municipio]);

  // Filtrar recintos cuando cambia la búsqueda
  useEffect(() => {
    if (busquedaRecinto.trim() === '') {
      setRecintosFiltrados(recintos);
    } else {
      const termino = busquedaRecinto.toLowerCase();
      const filtrados = recintos.filter(rec => 
        rec.nombre.toLowerCase().includes(termino)
      );
      setRecintosFiltrados(filtrados);
    }
  }, [busquedaRecinto, recintos]);

  // Cargar localidades cuando cambia recinto
  useEffect(() => {
    if (seleccion.id_recinto) {
      // Obtener detalles del recinto con latitud y longitud
      api.get(`/api/recintos/${seleccion.id_recinto}`)
        .then(res => {
          setRecintoSeleccionado(res.data);
          // Si el recinto tiene localidad, cargarla
          if (res.data.id_localidad) {
            api.get(`/api/localidades/${res.data.id_localidad}`)
              .then(resLocalidad => {
                setLocalidades([resLocalidad.data]);
                setSeleccion(prev => ({ ...prev, id_localidad: res.data.id_localidad }));
              })
              .catch(err => console.error('Error al cargar localidad', err));
          }
        })
        .catch(err => {
          console.error('Error al cargar recinto', err);
          setRecintoSeleccionado(null);
        });
    }
  }, [seleccion.id_recinto]);

  const handleSelectChange = (campo, valor) => {
    setSeleccion(prev => ({ ...prev, [campo]: valor }));
  };

  const resetSeleccion = () => {
    setSeleccion({
      id_departamento: '',
      id_provincia: '',
      id_municipio: '',
      id_recinto: '',
      id_localidad: ''
    });
    setProvincias([]);
    setMunicipios([]);
    setRecintos([]);
    setRecintosFiltrados([]);
    setLocalidades([]);
    setRecintoSeleccionado(null);
    setBusquedaRecinto('');
  };

  const cargarRecintosEnMapa = async () => {
    if (!seleccion.id_municipio) {
      setError('⚠️ Seleccione un municipio para ver los recintos en el mapa');
      return;
    }

    setLoadingMapa(true);
    setMostrarMapaRecintos(true);
    setError('');
    setRecintosConCoordenadas([]);

    try {
      console.log('🔍 Cargando recintos para municipio:', seleccion.id_municipio);
      
      // OPTIMIZADO: Obtener todos los recintos con coordenadas en una sola petición
      const response = await api.get(`/api/recintos/municipio/${seleccion.id_municipio}/con-coordenadas`);

      console.log('✅ Response del API:', response);
      const recintosDetalles = response.data;

      console.log('📍 Recintos cargados:', recintosDetalles);
      console.log('📍 Cantidad de recintos:', recintosDetalles ? recintosDetalles.length : 0);

      if (!recintosDetalles || recintosDetalles.length === 0) {
        setError('⚠️ No hay recintos registrados en este municipio');
        setLoadingMapa(false);
        return;
      }

      // Filtrar recintos con coordenadas válidas
      const recintosCoords = recintosDetalles
        .filter(r => {
          const tieneCoordenadas = r.latitud !== null && r.longitud !== null && 
                                   r.latitud !== undefined && r.longitud !== undefined;
          if (!tieneCoordenadas) {
            console.log('⚠️ Recinto sin coordenadas:', r.nombre);
          }
          return tieneCoordenadas;
        })
        .map(r => ({
          id: r.id_recinto,
          nombre: r.nombre,
          latitud: parseFloat(r.latitud),
          longitud: parseFloat(r.longitud),
          direccion: r.direccion,
          zona: r.zona
        }));

      console.log('🎯 Recintos con coordenadas válidas:', recintosCoords.length);
      console.log('🎯 Recintos con coordenadas:', recintosCoords);
      setRecintosConCoordenadas(recintosCoords);

      if (recintosCoords.length === 0) {
        setError('⚠️ No hay recintos con coordenadas registradas en este municipio');
      }
    } catch (err) {
      console.error('❌ Error al cargar recintos en el mapa:', err);
      console.error('❌ Error details:', err.response?.data);
      setError('❌ Error al cargar los recintos en el mapa: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoadingMapa(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🗺️ Mapa Geográfico de Recintos</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
        >
          ↩️ Volver al Dashboard
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border border-red-200">{error}</div>}

      {/* Panel de Selección */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">📍 Seleccionar Ubicación</h2>
          <button
            onClick={cargarRecintosEnMapa}
            disabled={!seleccion.id_municipio || loadingMapa}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-blue-500/30"
          >
            {loadingMapa ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Cargando...</span>
              </>
            ) : (
              <>
                <span>🗺️</span>
                <span>Ver Mapa con Todos los Recintos</span>
              </>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* Departamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
            <select
              value={seleccion.id_departamento}
              onChange={(e) => handleSelectChange('id_departamento', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccione...</option>
              {departamentos.map(depto => (
                <option key={depto.id} value={depto.id}>{depto.nombre}</option>
              ))}
            </select>
          </div>

          {/* Provincia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
            <select
              value={seleccion.id_provincia}
              onChange={(e) => handleSelectChange('id_provincia', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              disabled={!seleccion.id_departamento}
            >
              <option value="">Seleccione...</option>
              {provincias.map(prov => (
                <option key={prov.id} value={prov.id}>{prov.nombre}</option>
              ))}
            </select>
          </div>

          {/* Municipio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
            <select
              value={seleccion.id_municipio}
              onChange={(e) => handleSelectChange('id_municipio', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              disabled={!seleccion.id_provincia}
            >
              <option value="">Seleccione...</option>
              {municipios.map(mun => (
                <option key={mun.id} value={mun.id}>{mun.nombre}</option>
              ))}
            </select>
          </div>

          {/* Recinto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recinto</label>
            <input
              type="text"
              value={busquedaRecinto}
              onChange={(e) => setBusquedaRecinto(e.target.value)}
              placeholder="🔍 Buscar recinto..."
              className="w-full p-2 border border-gray-300 rounded-lg mb-2"
              disabled={!seleccion.id_municipio}
            />
            <select
              value={seleccion.id_recinto}
              onChange={(e) => handleSelectChange('id_recinto', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto"
              disabled={!seleccion.id_municipio}
              size="5"
            >
              <option value="">Seleccione un recinto...</option>
              {recintosFiltrados.map(rec => (
                <option key={rec.id} value={rec.id}>{rec.nombre}</option>
              ))}
            </select>
            {recintosFiltrados.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {recintosFiltrados.length} recinto(s) encontrado(s)
              </p>
            )}
          </div>

          {/* Localidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
            <input
              type="text"
              value={localidades.length > 0 ? localidades[0].nombre : ''}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
              placeholder="Seleccione recinto"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={resetSeleccion}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            ↺ Limpiar selección
          </button>
        </div>
      </div>

      {/* Información del Recinto y Mapa */}
      {recintoSeleccionado ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Recinto */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Información del Recinto</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-semibold text-gray-800">{recintoSeleccionado.nombre}</p>
              </div>

              {recintoSeleccionado.direccion && (
                <div>
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-semibold text-gray-800">{recintoSeleccionado.direccion}</p>
                </div>
              )}

              {recintoSeleccionado.zona && (
                <div>
                  <p className="text-sm text-gray-600">Zona</p>
                  <p className="font-semibold text-gray-800">{recintoSeleccionado.zona}</p>
                </div>
              )}

              {localidades.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Localidad</p>
                  <p className="font-semibold text-gray-800">{localidades[0].nombre}</p>
                </div>
              )}

              {recintoSeleccionado.distrito_nombre && (
                <div>
                  <p className="text-sm text-gray-600">Distrito</p>
                  <p className="font-semibold text-gray-800">
                    Distrito {recintoSeleccionado.nro_distrito || '?'}
                  </p>
                </div>
              )}

              {recintoSeleccionado.latitud && recintoSeleccionado.longitud && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Latitud</p>
                    <p className="font-mono font-semibold text-blue-600">{recintoSeleccionado.latitud}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Longitud</p>
                    <p className="font-mono font-semibold text-blue-600">{recintoSeleccionado.longitud}</p>
                  </div>
                </>
              )}

              {/* Enlaces externos */}
              {recintoSeleccionado.latitud && recintoSeleccionado.longitud && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">🔗 Ver en:</p>
                  <div className="space-y-2">
                    <a
                      href={`https://www.google.com/maps?q=${recintoSeleccionado.latitud},${recintoSeleccionado.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm"
                    >
                      🗺️ Google Maps
                    </a>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${recintoSeleccionado.latitud}&mlon=${recintoSeleccionado.longitud}#map=16/${recintoSeleccionado.latitud}/${recintoSeleccionado.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center text-sm"
                    >
                      🌍 OpenStreetMap
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mapa */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📍 Ubicación en el Mapa</h2>
            
            {recintoSeleccionado.latitud && recintoSeleccionado.longitud ? (
              <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-300">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${recintoSeleccionado.longitud - 0.01},${recintoSeleccionado.latitud - 0.01},${recintoSeleccionado.longitud + 0.01},${recintoSeleccionado.latitud + 0.01}&layer=mapnik&marker=${recintoSeleccionado.latitud},${recintoSeleccionado.longitud}`}
                  style={{ border: '1px solid #ddd' }}
                  title="Mapa de ubicación"
                />
              </div>
            ) : (
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-4xl mb-2">📍</p>
                  <p className="font-medium">No hay coordenadas disponibles</p>
                  <p className="text-sm mt-2">Este recinto no tiene latitud y longitud registradas</p>
                </div>
              </div>
            )}

            {/* Coordenadas para copiar */}
            {recintoSeleccionado.latitud && recintoSeleccionado.longitud && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">📋 Coordenadas para copiar:</p>
                <code className="block p-2 bg-white rounded border border-gray-300 font-mono text-sm">
                  {recintoSeleccionado.latitud}, {recintoSeleccionado.longitud}
                </code>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mensaje cuando no hay recinto seleccionado */
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
          <div className="text-gray-400">
            <p className="text-6xl mb-4">🗺️</p>
            <p className="text-xl font-medium text-gray-600">Selecciona un recinto para ver su ubicación</p>
            <p className="text-sm mt-2 text-gray-500">
              Usa los filtros de arriba para buscar por departamento, provincia, municipio y recinto
            </p>
          </div>
        </div>
      )}

      {/* Modal con Mapa de Todos los Recintos */}
      {mostrarMapaRecintos && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">🗺️</span>
                  Recintos del Municipio
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {loadingMapa ? '⏳ Cargando...' : `${recintosConCoordenadas.length} recinto(s) con coordenadas registradas`}
                </p>
              </div>
              <button
                onClick={() => setMostrarMapaRecintos(false)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
              >
                <span className="text-xl">✕</span>
                <span>Cerrar</span>
              </button>
            </div>

            {/* Loading indicator */}
            {loadingMapa && (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-pulse">🗺️</div>
                  <p className="text-xl font-semibold text-gray-700">Cargando mapa...</p>
                  <p className="text-sm text-gray-500 mt-2">Obteniendo coordenadas de los recintos</p>
                </div>
              </div>
            )}

            {/* Contenido del Modal (solo si no está cargando) */}
            {!loadingMapa && (
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Mapa */}
              <div className="flex-1 h-[60vh] lg:h-full min-h-[400px]">
                {recintosConCoordenadas.length > 0 ? (
                  <MapContainer
                    center={[recintosConCoordenadas[0].latitud, recintosConCoordenadas[0].longitud]}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="w-full h-full"
                    style={{ minHeight: '400px' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ChangeView
                      center={[recintosConCoordenadas[0].latitud, recintosConCoordenadas[0].longitud]}
                      zoom={13}
                    />
                    <FitBoundsToRecintos recintos={recintosConCoordenadas} />
                    <ZoomToRecinto recintoParaZoom={recintoParaZoom} />
                    {recintosConCoordenadas.map((recinto, index) => (
                      <Marker
                        key={recinto.id}
                        position={[recinto.latitud, recinto.longitud]}
                      >
                        <Popup>
                          <div className="p-2 max-w-xs">
                            <h3 className="font-bold text-gray-800 mb-1">{recinto.nombre}</h3>
                            {recinto.direccion && (
                              <p className="text-sm text-gray-600">📍 {recinto.direccion}</p>
                            )}
                            {recinto.zona && (
                              <p className="text-sm text-gray-600">Zona: {recinto.zona}</p>
                            )}
                            {recinto.distrito_nombre && (
                              <p className="text-sm text-gray-600 mt-1">
                                🏛️ Distrito {recinto.nro_distrito || '?'}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Coord: {recinto.latitud}, {recinto.longitud}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center min-h-[400px]">
                    <div className="text-center text-gray-500 p-8">
                      <p className="text-5xl mb-4">📍</p>
                      <p className="font-medium text-lg">No hay recintos con coordenadas</p>
                      <p className="text-sm mt-2">Los recintos de este municipio no tienen latitud y longitud registradas</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de Recintos */}
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto max-h-[30vh] lg:max-h-full">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800">📋 Lista de Recintos</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {recintosConCoordenadas.length} registrados
                  </p>
                </div>
                {recintosConCoordenadas.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-sm">Sin coordenadas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {recintosConCoordenadas.map((recinto) => (
                      <div
                        key={recinto.id}
                        onClick={() => hacerZoomEnRecinto(recinto)}
                        className="p-3 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Haz clic para hacer zoom en este recinto"
                      >
                        <p className="font-semibold text-gray-800 text-sm">{recinto.nombre}</p>
                        {recinto.direccion && (
                          <p className="text-xs text-gray-600 mt-1 truncate">{recinto.direccion}</p>
                        )}
                        {recinto.distrito_nombre && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            🏛️ Distrito {recinto.nro_distrito || '?'}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          {recinto.latitud}, {recinto.longitud}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
