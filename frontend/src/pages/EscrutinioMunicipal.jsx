// frontend/src/pages/EscrutinioMunicipal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function EscrutinioMunicipal() {
  const navigate = useNavigate();

  // Estados para selección geográfica
  const [departamentos, setDepartamentos] = useState({});
  const [provincias, setProvincias] = useState({});
  const [municipios, setMunicipios] = useState({});
  const [recintos, setRecintos] = useState({});
  const [mesas, setMesas] = useState({});
  const [cargos, setCargos] = useState({});
  const [organizaciones, setOrganizaciones] = useState({});

  // Estados de formulario
  const [formData, setFormData] = useState({
    id_departamento: '',
    id_provincia: '',
    id_municipio: '',
    id_recinto: '',
    id_mesa: '',
    codigo_acta: '',
    total_papeletas_utilizadas: 0,
    observaciones: ''
  });

  // Estado para ACTA MUNICIPAL (Alcalde + Concejal en MISMA acta)
  const [actaMunicipal, setActaMunicipal] = useState({
    id_cargo_alcalde: '',
    id_cargo_concejal: '',
    tipo_papeleta: 'MUNICIPAL',
    votos_blancos_alcalde: 0,
    votos_nulos_alcalde: 0,
    votos_blancos_concejal: 0,
    votos_nulos_concejal: 0,
    votosAlcalde: {},
    votosConcejal: {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cantidadInscritos, setCantidadInscritos] = useState(0);

  // Archivos - Múltiples imágenes
  const [filesActa, setFilesActa] = useState([]);
  const [filesHoja, setFilesHoja] = useState([]);
  const [previewsActa, setPreviewsActa] = useState([]);
  const [previewsHoja, setPreviewsHoja] = useState([]);

  // Búsqueda de recinto
  const [busquedaRecinto, setBusquedaRecinto] = useState('');
  const [recintosFiltrados, setRecintosFiltrados] = useState([]);

  // Cargar catálogos iniciales
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const deptoRes = await api.get('/api/catalog?table=departamentos');
        setDepartamentos(deptoRes.data);

        const orgRes = await api.get('/api/catalog?table=organizaciones_politicas');
        setOrganizaciones(orgRes.data);

        const cargoRes = await api.get('/api/catalog?table=cargos');
        setCargos(cargoRes.data);

        // Inicializar votos con 0 para cada organización
        const votos = {};
        Object.values(orgRes.data).forEach(id => { 
          votos[id] = 0; 
        });

        // Detectar y asignar cargos automáticamente
        let idCargoAlcalde = '';
        let idCargoConcejal = '';

        Object.entries(cargoRes.data).forEach(([nombre, id]) => {
          const nombreLower = nombre.toLowerCase();
          if (nombreLower.includes('alcalde')) {
            idCargoAlcalde = id;
          } else if (nombreLower.includes('concejal')) {
            idCargoConcejal = id;
          }
        });

        setActaMunicipal(prev => ({
          ...prev,
          votosAlcalde: {...votos},
          votosConcejal: {...votos},
          id_cargo_alcalde: idCargoAlcalde,
          id_cargo_concejal: idCargoConcejal
        }));
      } catch (err) {
        console.error("Error al cargar catálogos", err);
        setError("❌ Error al cargar los catálogos");
      }
    };
    cargarCatalogos();
  }, []);

  // Cargar provincias cuando cambia departamento
  useEffect(() => {
    if (formData.id_departamento) {
      api.get(`/api/provincias/departamento/${formData.id_departamento}`)
        .then(res => setProvincias(res.data))
        .catch(err => console.error("Error al cargar provincias", err));
      setFormData(prev => ({
        ...prev,
        id_provincia: '',
        id_municipio: '',
        id_recinto: '',
        id_mesa: ''
      }));
      setMunicipios({});
      setRecintos({});
      setMesas({});
      setCantidadInscritos(0);
    }
  }, [formData.id_departamento]);

  // Cargar municipios cuando cambia provincia
  useEffect(() => {
    if (formData.id_provincia) {
      api.get(`/api/municipios/provincia/${formData.id_provincia}`)
        .then(res => setMunicipios(res.data))
        .catch(err => console.error("Error al cargar municipios", err));
      setFormData(prev => ({
        ...prev,
        id_municipio: '',
        id_recinto: '',
        id_mesa: ''
      }));
      setRecintos({});
      setMesas({});
      setCantidadInscritos(0);
    }
  }, [formData.id_provincia]);

  // Cargar recintos cuando cambia municipio
  useEffect(() => {
    if (formData.id_municipio) {
      api.get(`/api/recintos/municipio/${formData.id_municipio}`)
        .then(res => {
          setRecintos(res.data);
          setRecintosFiltrados(Object.entries(res.data).map(([nombre, id]) => ({ id, nombre })));
          setFormData(prev => ({
            ...prev,
            id_recinto: '',
            id_mesa: ''
          }));
          setMesas({});
          setCantidadInscritos(0);
          setBusquedaRecinto('');
        })
        .catch(err => console.error("Error al cargar recintos", err));
    }
  }, [formData.id_municipio]);

  // Filtrar recintos cuando cambia la búsqueda
  useEffect(() => {
    const recintosArray = Object.entries(recintos).map(([nombre, id]) => ({ id, nombre }));
    if (busquedaRecinto.trim() === '') {
      setRecintosFiltrados(recintosArray);
    } else {
      const termino = busquedaRecinto.toLowerCase();
      const filtrados = recintosArray.filter(rec => 
        rec.nombre.toLowerCase().includes(termino)
      );
      setRecintosFiltrados(filtrados);
    }
  }, [busquedaRecinto, recintos]);

  // Cargar mesas cuando cambia recinto
  useEffect(() => {
    if (formData.id_recinto) {
      api.get(`/api/mesas/recinto/${formData.id_recinto}`)
        .then(res => setMesas(res.data))
        .catch(err => console.error("Error al cargar mesas", err));
      setFormData(prev => ({
        ...prev,
        id_mesa: ''
      }));
      setCantidadInscritos(0);
    }
  }, [formData.id_recinto]);

  // Cargar cantidad de inscritos
  useEffect(() => {
    if (formData.id_mesa) {
      api.get(`/api/mesas/${formData.id_mesa}`)
        .then(res => {
          setCantidadInscritos(res.data?.cantidad_inscritos || 0);
        })
        .catch(err => {
          console.error("Error al cargar inscritos", err);
          setCantidadInscritos(0);
        });
    } else {
      setCantidadInscritos(0);
    }
  }, [formData.id_mesa]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Manejadores para cambio de cargos
  const handleCargoAlcaldeChange = (e) => {
    const idCargo = e.target.value;
    setActaMunicipal(prev => ({
      ...prev,
      id_cargo_alcalde: idCargo
    }));
  };

  const handleCargoConcejalChange = (e) => {
    const idCargo = e.target.value;
    setActaMunicipal(prev => ({
      ...prev,
      id_cargo_concejal: idCargo
    }));
  };

  const handleVotoAlcaldeChange = (idOrg, value) => {
    const numValue = value === '' ? 0 : Number(value) || 0;
    setActaMunicipal(prev => ({
      ...prev,
      votosAlcalde: {
        ...prev.votosAlcalde,
        [idOrg]: Math.max(0, numValue)
      }
    }));
  };

  const handleVotoConcejalChange = (idOrg, value) => {
    const numValue = value === '' ? 0 : Number(value) || 0;
    setActaMunicipal(prev => ({
      ...prev,
      votosConcejal: {
        ...prev.votosConcejal,
        [idOrg]: Math.max(0, numValue)
      }
    }));
  };

  const handleBlancosNulosAlcalde = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setActaMunicipal(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleBlancosNulosConcejal = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setActaMunicipal(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Manejadores para selección múltiple de imágenes
  const handleFileActaChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = [...filesActa, ...selectedFiles];
    const newPreviews = [];
    
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newPreviews.push({ file, url });
      }
    });
    
    setFilesActa(newFiles);
    setPreviewsActa(newPreviews);
  };

  const handleFileHojaChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = [...filesHoja, ...selectedFiles];
    const newPreviews = [];
    
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newPreviews.push({ file, url });
      }
    });
    
    setFilesHoja(newFiles);
    setPreviewsHoja(newPreviews);
  };

  const removeFileActa = (index) => {
    const newFiles = filesActa.filter((_, i) => i !== index);
    const newPreviews = previewsActa.filter((_, i) => i !== index);
    setFilesActa(newFiles);
    setPreviewsActa(newPreviews);
  };

  const removeFileHoja = (index) => {
    const newFiles = filesHoja.filter((_, i) => i !== index);
    const newPreviews = previewsHoja.filter((_, i) => i !== index);
    setFilesHoja(newFiles);
    setPreviewsHoja(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.id_mesa) {
      setError("❌ Debe seleccionar una mesa");
      return;
    }

    if (!formData.codigo_acta.trim()) {
      setError("❌ El código de acta es obligatorio");
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id_usuario) {
      setError("❌ Usuario no autenticado");
      return;
    }

    // Validar totales de votos para ambos cargos
    const totalVotosAlcalde = Object.values(actaMunicipal.votosAlcalde).reduce((sum, v) => sum + (Number(v) || 0), 0) +
                              (Number(actaMunicipal.votos_blancos_alcalde) || 0) +
                              (Number(actaMunicipal.votos_nulos_alcalde) || 0);

    const totalVotosConcejal = Object.values(actaMunicipal.votosConcejal).reduce((sum, v) => sum + (Number(v) || 0), 0) +
                               (Number(actaMunicipal.votos_blancos_concejal) || 0) +
                               (Number(actaMunicipal.votos_nulos_concejal) || 0);

    if (totalVotosAlcalde > cantidadInscritos) {
      setError(`⚠️ Alcalde: Total de votos (${totalVotosAlcalde}) no puede superar inscritos (${cantidadInscritos})`);
      return;
    }

    if (totalVotosConcejal > cantidadInscritos) {
      setError(`⚠️ Concejal: Total de votos (${totalVotosConcejal}) no puede superar inscritos (${cantidadInscritos})`);
      return;
    }

    // Validación de tamaño de archivos (máximo 5MB por archivo)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_FILES = 5; // Máximo 5 archivos por tipo
    
    if (filesActa.length > MAX_FILES) {
      setError(`❌ Máximo ${MAX_FILES} archivos de acta permitidos`);
      return;
    }
    if (filesHoja.length > MAX_FILES) {
      setError(`❌ Máximo ${MAX_FILES} archivos de hoja de trabajo permitidos`);
      return;
    }
    
    for (const file of filesActa) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`❌ El archivo de acta "${file.name}" excede 5MB`);
        return;
      }
    }
    for (const file of filesHoja) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`❌ El archivo de hoja de trabajo "${file.name}" excede 5MB`);
        return;
      }
    }

    // Preparar datos para enviar
    const formDataToSend = new FormData();
    formDataToSend.append('id_mesa', formData.id_mesa);
    formDataToSend.append('codigo_acta', formData.codigo_acta.trim());
    formDataToSend.append('total_actas', Number(formData.total_papeletas_utilizadas) || 0);
    formDataToSend.append('observaciones', formData.observaciones || '');
    formDataToSend.append('user_id', user.id_usuario);
    formDataToSend.append('id_cargo_alcalde', actaMunicipal.id_cargo_alcalde);
    formDataToSend.append('id_cargo_concejal', actaMunicipal.id_cargo_concejal);
    formDataToSend.append('votos_blancos_alcalde', Number(actaMunicipal.votos_blancos_alcalde) || 0);
    formDataToSend.append('votos_nulos_alcalde', Number(actaMunicipal.votos_nulos_alcalde) || 0);
    formDataToSend.append('votos_blancos_concejal', Number(actaMunicipal.votos_blancos_concejal) || 0);
    formDataToSend.append('votos_nulos_concejal', Number(actaMunicipal.votos_nulos_concejal) || 0);

    // Filtrar votos para enviar solo los que tienen valor mayor a 0
    const votosAlcaldeFiltrados = {};
    for (const [id, valor] of Object.entries(actaMunicipal.votosAlcalde)) {
      const numValor = Number(valor) || 0;
      if (numValor > 0) {
        votosAlcaldeFiltrados[id] = numValor;
      }
    }

    const votosConcejalFiltrados = {};
    for (const [id, valor] of Object.entries(actaMunicipal.votosConcejal)) {
      const numValor = Number(valor) || 0;
      if (numValor > 0) {
        votosConcejalFiltrados[id] = numValor;
      }
    }

    formDataToSend.append('votos_alcalde', JSON.stringify(votosAlcaldeFiltrados));
    formDataToSend.append('votos_concejal', JSON.stringify(votosConcejalFiltrados));

    // Agregar múltiples archivos de acta
    filesActa.forEach(file => {
      formDataToSend.append('f_acta', file);
    });
    
    // Agregar múltiples archivos de hoja de trabajo
    filesHoja.forEach(file => {
      formDataToSend.append('f_h_trabajo', file);
    });

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/escrutinio/municipal', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log("Respuesta del servidor:", response.data);
      alert("✅ Acta Municipal registrada exitosamente");
      navigate('/dashboard');
    } catch (err) {
      console.error("Error al guardar acta", err);
      console.error("Detalles del error:", err.response?.data);
      
      let msg = "❌ Error al guardar el acta. ";
      if (err.response?.status === 400) {
        msg += err.response?.data?.detail || "Solicitud incorrecta.";
      } else if (err.response?.status === 500) {
        msg += "Error interno del servidor.";
      } else {
        msg += err.response?.data?.detail || err.response?.data?.error || "Intente nuevamente.";
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">🏘️ Ingreso de Acta - Municipal</h1>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} encType="multipart/form-data">

          {/* Selección geográfica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <SelectField
              label="Departamento"
              value={formData.id_departamento}
              onChange={(e) => setFormData({ ...formData, id_departamento: e.target.value })}
              options={departamentos}
            />
            <SelectField
              label="Provincia"
              value={formData.id_provincia}
              onChange={(e) => setFormData({ ...formData, id_provincia: e.target.value })}
              options={provincias}
              disabled={!formData.id_departamento}
            />
            <SelectField
              label="Municipio"
              value={formData.id_municipio}
              onChange={(e) => setFormData({ ...formData, id_municipio: e.target.value })}
              options={municipios}
              disabled={!formData.id_provincia}
            />
            {/* Recinto con búsqueda */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Recinto</label>
              <input
                type="text"
                value={busquedaRecinto}
                onChange={(e) => setBusquedaRecinto(e.target.value)}
                placeholder="🔍 Buscar recinto..."
                className="w-full p-2 border border-gray-300 rounded-lg mb-2 text-sm"
                disabled={!formData.id_municipio}
              />
              <select
                value={formData.id_recinto}
                onChange={(e) => setFormData({ ...formData, id_recinto: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm max-h-48 overflow-y-auto"
                disabled={!formData.id_municipio}
                size="4"
              >
                <option value="">Seleccione un recinto...</option>
                {recintosFiltrados.map(rec => (
                  <option key={rec.id} value={rec.id}>{rec.nombre}</option>
                ))}
              </select>
              {recintosFiltrados.length > 0 && recintosFiltrados.length < recintos.length && (
                <p className="text-xs text-gray-500 mt-1">
                  {recintosFiltrados.length} recinto(s) encontrado(s) de {recintos.length}
                </p>
              )}
            </div>
            <SelectField
              label="Mesa"
              value={formData.id_mesa}
              onChange={(e) => setFormData({ ...formData, id_mesa: e.target.value })}
              options={mesas}
              disabled={!formData.id_recinto}
            />
            <div>
              <label className="block text-gray-700 font-medium mb-1">Cantidad de Inscritos</label>
              <input
                type="number"
                value={cantidadInscritos}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
              />
            </div>
          </div>

          {/* Código de Acta y Total Papeletas (COMPARTIDA para Alcalde + Concejal) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Código de Acta Municipal *</label>
              <input
                type="text"
                value={formData.codigo_acta}
                onChange={(e) => setFormData({ ...formData, codigo_acta: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Ej: ACTA-MUN-001"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Total Papeletas Utilizadas *</label>
              <input
                type="number"
                value={formData.total_papeletas_utilizadas}
                onChange={(e) => setFormData({ ...formData, total_papeletas_utilizadas: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Ej: 250"
                required
              />
            </div>
          </div>

          {/* DOS SECCIONES - ALCALDE Y CONCEJAL EN MISMA ACTA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            {/* ALCALDE */}
            <div className="border-2 border-orange-400 rounded-lg p-4 bg-orange-50">
              <h2 className="text-base font-bold text-orange-800 mb-3">🏘️ ALCALDE</h2>

              <div className="mb-3">
                <label className="block text-gray-700 font-medium mb-1 text-sm">Cargo *</label>
                <select
                  value={actaMunicipal.id_cargo_alcalde}
                  onChange={handleCargoAlcaldeChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Selecciona</option>
                  {Object.entries(cargos)
                    .filter(([nombre]) => nombre.toLowerCase().includes('alcalde'))
                    .map(([nombre, id]) => (
                      <option key={id} value={id}>{nombre}</option>
                    ))}
                </select>
              </div>

              {Object.keys(organizaciones).length > 0 && (
                <div className="mb-3">
                  <h4 className="font-bold text-gray-800 mb-2 text-xs">Votos por Organización Política</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(organizaciones).map(([nombre, id]) => (
                      <div key={id} className="flex items-center justify-between bg-white p-1 rounded border border-orange-200 text-sm">
                        <span className="font-medium text-gray-700 text-xs">{nombre}</span>
                        <input
                          type="number"
                          min="0"
                          value={actaMunicipal.votosAlcalde[id] || 0}
                          onChange={(e) => handleVotoAlcaldeChange(id, e.target.value)}
                          className="w-12 p-1 border border-gray-300 rounded text-right font-semibold text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1 mb-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">Blancos</label>
                  <input
                    type="number"
                    min="0"
                    value={actaMunicipal.votos_blancos_alcalde}
                    onChange={(e) => handleBlancosNulosAlcalde('votos_blancos_alcalde', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-center font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Nulos</label>
                  <input
                    type="number"
                    min="0"
                    value={actaMunicipal.votos_nulos_alcalde}
                    onChange={(e) => handleBlancosNulosAlcalde('votos_nulos_alcalde', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-center font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="bg-orange-100 border border-orange-300 rounded p-2 text-xs">
                <p className="text-gray-700"><span className="font-bold">Total:</span> {
                  Object.values(actaMunicipal.votosAlcalde).reduce((a,v)=>a+(Number(v)||0), 0) +
                  (Number(actaMunicipal.votos_blancos_alcalde) || 0) +
                  (Number(actaMunicipal.votos_nulos_alcalde) || 0)
                }</p>
              </div>
            </div>

            {/* CONCEJAL */}
            <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50">
              <h2 className="text-base font-bold text-green-800 mb-3">🏛️ CONCEJAL</h2>

              <div className="mb-3">
                <label className="block text-gray-700 font-medium mb-1 text-sm">Cargo *</label>
                <select
                  value={actaMunicipal.id_cargo_concejal}
                  onChange={handleCargoConcejalChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Selecciona</option>
                  {Object.entries(cargos)
                    .filter(([nombre]) => nombre.toLowerCase().includes('concejal'))
                    .map(([nombre, id]) => (
                      <option key={id} value={id}>{nombre}</option>
                    ))}
                </select>
              </div>

              {Object.keys(organizaciones).length > 0 && (
                <div className="mb-3">
                  <h4 className="font-bold text-gray-800 mb-2 text-xs">Votos por Organización Política</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(organizaciones).map(([nombre, id]) => (
                      <div key={id} className="flex items-center justify-between bg-white p-1 rounded border border-green-200 text-sm">
                        <span className="font-medium text-gray-700 text-xs">{nombre}</span>
                        <input
                          type="number"
                          min="0"
                          value={actaMunicipal.votosConcejal[id] || 0}
                          onChange={(e) => handleVotoConcejalChange(id, e.target.value)}
                          className="w-12 p-1 border border-gray-300 rounded text-right font-semibold text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1 mb-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">Blancos</label>
                  <input
                    type="number"
                    min="0"
                    value={actaMunicipal.votos_blancos_concejal}
                    onChange={(e) => handleBlancosNulosConcejal('votos_blancos_concejal', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-center font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Nulos</label>
                  <input
                    type="number"
                    min="0"
                    value={actaMunicipal.votos_nulos_concejal}
                    onChange={(e) => handleBlancosNulosConcejal('votos_nulos_concejal', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-center font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="bg-green-100 border border-green-300 rounded p-2 text-xs">
                <p className="text-gray-700"><span className="font-bold">Total:</span> {
                  Object.values(actaMunicipal.votosConcejal).reduce((a,v)=>a+(Number(v)||0), 0) +
                  (Number(actaMunicipal.votos_blancos_concejal) || 0) +
                  (Number(actaMunicipal.votos_nulos_concejal) || 0)
                }</p>
              </div>
            </div>
          </div>

          {/* Subida de archivos - Múltiples imágenes con vista previa */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Acta */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">📄 Imágenes del Acta</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileActaChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Máximo 5 archivos (5MB c/u)</p>
              
              {/* Vista previa de imágenes de acta */}
              {previewsActa.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {previewsActa.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview.url}
                        alt={`Acta ${index + 1}`}
                        className="w-full h-20 object-cover rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeFileActa(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Hoja de trabajo */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">📝 Hoja de Trabajo</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileHojaChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Máximo 5 archivos (5MB c/u)</p>
              
              {/* Vista previa de imágenes de hoja de trabajo */}
              {previewsHoja.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {previewsHoja.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview.url}
                        alt={`Hoja ${index + 1}`}
                        className="w-full h-20 object-cover rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeFileHoja(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Observaciones (Opcional)</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              rows="3"
              placeholder="Agregue cualquier observación importante..."
            />
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-600 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Acta Municipal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componentes reutilizables
function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1">{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full p-2 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100"
      >
        <option value="">Seleccione...</option>
        {Object.entries(options).map(([nombre, id]) => (
          <option key={id} value={id}>{nombre}</option>
        ))}
      </select>
    </div>
  );
}