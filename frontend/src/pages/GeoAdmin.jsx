// frontend/src/pages/GeoAdmin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GeoAdmin() {
  const [activeTab, setActiveTab] = useState('departamento');
  const [formData, setFormData] = useState({
    nombre: '',
    id_departamento: '',
    id_provincia: '',
    id_municipio: '',
    id_recinto: '',
    numero_mesa: '',
  });
  const [catalogs, setCatalogs] = useState({
    deptos: {},
    provs: {},
    munis: {},
    recintos: {},
  });
  const [loading, setLoading] = useState(false);
  const [showResumen, setShowResumen] = useState(false);
  const [resumenData, setResumenData] = useState(null);
  const navigate = useNavigate();

  // Cargar catálogos según la pestaña activa
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        if (activeTab === 'provincia') {
          const res = await api.get('/catalog?table=departamentos');
          setCatalogs(prev => ({ ...prev, deptos: res.data || {} }));
        } else if (activeTab === 'municipio') {
          const res = await api.get('/catalog?table=departamentos');
          setCatalogs(prev => ({ ...prev, deptos: res.data || {}, provs: {} }));
        } else if (activeTab === 'recinto') {
          const res = await api.get('/catalog?table=departamentos');
          setCatalogs(prev => ({ ...prev, deptos: res.data || {}, provs: {}, munis: {} }));
        } else if (activeTab === 'mesa') {
          const res = await api.get('/catalog?table=departamentos');
          setCatalogs(prev => ({ ...prev, deptos: res.data || {}, provs: {}, munis: {}, recintos: {} }));
        }
      } catch (err) {
        console.error('Error al cargar catálogos', err);
        alert('❌ Error al cargar los catálogos geográficos');
      }
    };
    loadCatalogs();
  }, [activeTab]);

  // Manejadores de cambio
  const handleDeptoChange = async (id) => {
    setFormData(prev => ({ 
      ...prev, 
      id_departamento: id, 
      id_provincia: '', 
      id_municipio: '', 
      id_recinto: '' 
    }));
    if (activeTab === 'municipio' || activeTab === 'recinto' || activeTab === 'mesa') {
      try {
        const res = await api.get(`/provincias/departamento/${id}`);
        setCatalogs(prev => ({ ...prev, provs: res.data || {}, munis: {}, recintos: {} }));
      } catch (err) {
        console.error('Error al cargar provincias', err);
        alert('❌ Error al cargar provincias');
      }
    }
  };

 const handleProvChange = async (idProv) => {
  setFormData(prev => ({ 
    ...prev, 
    id_provincia: idProv, 
    id_municipio: '', 
    id_recinto: '' 
  }));
  if (activeTab === 'recinto' || activeTab === 'mesa') {
    try {
      // ✅ Ruta corregida
      const res = await api.get(`/municipios/provincia/${idProv}`);
      setCatalogs(prev => ({ ...prev, munis: res.data || {}, recintos: {} }));
    } catch (err) {
      console.error('Error al cargar municipios', err);
      alert('❌ Error al cargar municipios');
    }
  }
};

  const handleMuniChange = async (id) => {
    setFormData(prev => ({ 
      ...prev, 
      id_municipio: id, 
      id_recinto: '' 
    }));
    if (activeTab === 'mesa') {
      try {
        const res = await api.get(`/recintos/municipio/${id}`);
        setCatalogs(prev => ({ ...prev, recintos: res.data || {} }));
      } catch (err) {
        console.error('Error al cargar recintos', err);
        alert('❌ Error al cargar recintos');
      }
    }
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let endpoint, payload;
      
      if (activeTab === 'departamento') {
        if (!formData.nombre.trim()) {
          alert('⚠️ El nombre del departamento es obligatorio');
          return;
        }
        endpoint = '/departamentos';
        payload = { nombre: formData.nombre.trim() };
        
      } else if (activeTab === 'provincia') {
        if (!formData.nombre.trim() || !formData.id_departamento) {
          alert('⚠️ Complete todos los campos');
          return;
        }
        endpoint = '/provincias';
        payload = { 
          nombre: formData.nombre.trim(), 
          id_departamento: parseInt(formData.id_departamento, 10) 
        };
        
      } else if (activeTab === 'municipio') {
        if (!formData.nombre.trim() || !formData.id_provincia) {
          alert('⚠️ Complete todos los campos');
          return;
        }
        endpoint = '/municipios';
        payload = { 
          nombre: formData.nombre.trim(), 
          id_provincia: parseInt(formData.id_provincia, 10) 
        };
        
      } else if (activeTab === 'recinto') {
        if (!formData.nombre.trim() || !formData.id_municipio) {
          alert('⚠️ Complete todos los campos');
          return;
        }
        endpoint = '/recintos';
        payload = { 
          nombre: formData.nombre.trim(), 
          id_municipio: parseInt(formData.id_municipio, 10) 
        };
        
      } else if (activeTab === 'mesa') {
        if (!formData.numero_mesa || !formData.id_recinto) {
          alert('⚠️ Complete todos los campos');
          return;
        }
        const numMesa = parseInt(formData.numero_mesa, 10);
        if (isNaN(numMesa) || numMesa <= 0) {
          alert('⚠️ El número de mesa debe ser un valor positivo');
          return;
        }
        endpoint = '/mesas';
        payload = { 
          numero_mesa: numMesa, 
          id_recinto: parseInt(formData.id_recinto, 10) 
        };
      }

      await api.post(endpoint, payload);
      alert(`✅ ${getTitle()} creado correctamente.`);
      
      setFormData({
        nombre: '',
        numero_mesa: '',
        id_departamento: '',
        id_provincia: '',
        id_municipio: '',
        id_recinto: '',
      });
      
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error desconocido';
      alert(`❌ Error: ${msg}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'departamento': return 'Departamento';
      case 'provincia': return 'Provincia';
      case 'municipio': return 'Municipio';
      case 'recinto': return 'Recinto';
      case 'mesa': return 'Mesa';
      default: return 'Entidad';
    }
  };

  // Cargar resumen geográfico
  const cargarResumen = async () => {
    setLoading(true);
    try {
      const [deptoRes, provRes, muniRes, recintoRes, mesaRes] = await Promise.all([
        api.get('/catalog?table=departamentos'),
        api.get('/catalog?table=provincias'),
        api.get('/catalog?table=municipios'),
        api.get('/catalog?table=recintos'),
        api.get('/catalog?table=mesas')
      ]);

      const mesasPorRecinto = {};
      Object.values(mesaRes.data || {}).forEach(id_mesa => {
        // Aquí necesitarías una API que devuelva mesas con id_recinto
        // Por ahora, simulamos con un conteo total
      });

      setResumenData({
        departamentos: Object.keys(deptoRes.data || {}).length,
        provincias: Object.keys(provRes.data || {}).length,
        municipios: Object.keys(muniRes.data || {}).length,
        recintos: Object.keys(recintoRes.data || {}).length,
        mesas: Object.keys(mesaRes.data || {}).length
      });
      setShowResumen(true);
    } catch (err) {
      console.error('Error al cargar resumen', err);
      alert('❌ Error al cargar el resumen geográfico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🗺️ Administración Geográfica</h1>
      
      {/* Botón de resumen */}
      <div className="mb-6">
        <button
          onClick={cargarResumen}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {loading ? 'Cargando...' : '📊 Ver Resumen Geográfico'}
        </button>
      </div>

      {/* Panel de resumen */}
      {showResumen && resumenData && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-3">📊 Resumen Geográfico</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-2xl font-bold text-blue-600">{resumenData.departamentos}</div>
              <div className="text-sm text-gray-600">Departamentos</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-2xl font-bold text-green-600">{resumenData.provincias}</div>
              <div className="text-sm text-gray-600">Provincias</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-2xl font-bold text-purple-600">{resumenData.municipios}</div>
              <div className="text-sm text-gray-600">Municipios</div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-2xl font-bold text-orange-600">{resumenData.recintos}</div>
              <div className="text-sm text-gray-600">Recintos</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-2xl font-bold text-red-600">{resumenData.mesas}</div>
              <div className="text-sm text-gray-600">Mesas</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowResumen(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Ocultar resumen
            </button>
          </div>
        </div>
      )}

      {/* Pestañas */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('departamento')}
          className={`px-4 py-2 rounded ${activeTab === 'departamento' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Departamentos
        </button>
        <button
          onClick={() => setActiveTab('provincia')}
          className={`px-4 py-2 rounded ${activeTab === 'provincia' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Provincias
        </button>
        <button
          onClick={() => setActiveTab('municipio')}
          className={`px-4 py-2 rounded ${activeTab === 'municipio' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Municipios
        </button>
        <button
          onClick={() => setActiveTab('recinto')}
          className={`px-4 py-2 rounded ${activeTab === 'recinto' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Recintos
        </button>
        <button
          onClick={() => setActiveTab('mesa')}
          className={`px-4 py-2 rounded ${activeTab === 'mesa' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Mesas
        </button>
      </div>

      {/* Formulario */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">➕ Agregar {getTitle()}</h2>
        <form onSubmit={handleSubmit}>
          {/* Nombre (para todos excepto mesa) */}
          {activeTab !== 'mesa' && (
            <input
              type="text"
              placeholder={`Nombre del ${getTitle().toLowerCase()}`}
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full p-2 border rounded mb-4"
              required
            />
          )}

          {/* Departamento (para provincia, municipio, recinto, mesa) */}
          {activeTab !== 'departamento' && (
            <select
              value={formData.id_departamento}
              onChange={e => handleDeptoChange(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              required
            >
              <option value="">Seleccione Departamento</option>
              {Object.entries(catalogs.deptos).map(([name, id]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}

          {/* Provincia (para municipio, recinto, mesa) */}
          {(activeTab === 'municipio' || activeTab === 'recinto' || activeTab === 'mesa') && (
            <select
              value={formData.id_provincia}
              onChange={e => handleProvChange(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              required
              disabled={!formData.id_departamento}
            >
              <option value="">Seleccione Provincia</option>
              {Object.entries(catalogs.provs).map(([name, id]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}

          {/* Municipio (para recinto y mesa) */}
          {(activeTab === 'recinto' || activeTab === 'mesa') && (
            <select
              value={formData.id_municipio}
              onChange={e => handleMuniChange(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              required
              disabled={!formData.id_provincia}
            >
              <option value="">Seleccione Municipio</option>
              {Object.entries(catalogs.munis).map(([name, id]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}

          {/* Recinto (solo para mesa) */}
          {activeTab === 'mesa' && (
            <select
              value={formData.id_recinto}
              onChange={e => setFormData({ ...formData, id_recinto: e.target.value })}
              className="w-full p-2 border rounded mb-4"
              required
              disabled={!formData.id_municipio}
            >
              <option value="">Seleccione Recinto</option>
              {Object.entries(catalogs.recintos).map(([name, id]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}

          {/* Número de mesa (solo para mesa) */}
          {activeTab === 'mesa' && (
            <input
              type="number"
              placeholder="Número de Mesa"
              value={formData.numero_mesa}
              onChange={e => setFormData({ ...formData, numero_mesa: e.target.value })}
              className="w-full p-2 border rounded mb-4"
              min="1"
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            {loading ? 'Guardando...' : '💾 Guardar'}
          </button>
        </form>
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ⬅️ Volver al Dashboard
        </button>
      </div>
    </div>
  );
}