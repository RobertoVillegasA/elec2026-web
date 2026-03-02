// frontend/src/pages/MapaGeografico.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
        <h2 className="text-xl font-bold text-gray-800 mb-4">📍 Seleccionar Ubicación</h2>
        
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
    </div>
  );
}
