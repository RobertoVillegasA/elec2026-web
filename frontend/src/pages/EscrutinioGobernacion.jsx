// frontend/src/pages/EscrutinioGobernacion.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function EscrutinioGobernacion() {
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

  // Estado para papeleta GOBERNADOR
  const [papeletaGovernador, setPapeletaGovernador] = useState({
    id_cargo: '',
    tipo_papeleta: 'SUBNACIONAL',
    votos_blancos: 0,
    votos_nulos: 0,
    votosPartido: {}
  });

  // Estado para papeleta ASAMBLEISTA POBLACIÓN
  const [papeletaAsamblPoblacion, setPapeletaAsamblPoblacion] = useState({
    id_cargo: '',
    tipo_papeleta: 'SUBNACIONAL',
    votos_blancos: 0,
    votos_nulos: 0,
    votosPartido: {}
  });

  // Estado para papeleta ASAMBLEISTA TERRITORIO
  const [papeletaAsamblTerritorio, setPapeletaAsamblTerritorio] = useState({
    id_cargo: '',
    tipo_papeleta: 'SUBNACIONAL',
    votos_blancos: 0,
    votos_nulos: 0,
    votosPartido: {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cantidadInscritos, setCantidadInscritos] = useState(0);

  // Archivos
  const [fileActa, setFileActa] = useState(null);
  const [fileHoja, setFileHoja] = useState(null);

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
        
        const votos = {};
        Object.entries(orgRes.data).forEach(([nombre, id]) => { votos[id] = 0; });

        // Detectar y asignar cargos automáticamente
        // id 7 = Asambleista por Población, id 8 = Asambleista por Territorio
        let idCargoGobernador = '';
        let idCargoAsamblPoblacion = '7';  // ID para Asambleista por Población
        let idCargoAsamblTerritorio = '8';  // ID para Asambleista por Territorio

        Object.entries(cargoRes.data).forEach(([nombre, id]) => {
          const nombreLower = nombre.toLowerCase();
          if (nombreLower.includes('gobernador')) {
            idCargoGobernador = id;
          }
        });

        setPapeletaGovernador(prev => ({ 
          ...prev, 
          votosPartido: votos,
          id_cargo: idCargoGobernador
        }));

        setPapeletaAsamblPoblacion(prev => ({ 
          ...prev, 
          votosPartido: votos,
          id_cargo: idCargoAsamblPoblacion
        }));

        setPapeletaAsamblTerritorio(prev => ({ 
          ...prev, 
          votosPartido: votos,
          id_cargo: idCargoAsamblTerritorio
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
        .then(res => setRecintos(res.data))
        .catch(err => console.error("Error al cargar recintos", err));
      setFormData(prev => ({
        ...prev,
        id_recinto: '',
        id_mesa: ''
      }));
      setMesas({});
      setCantidadInscritos(0);
    }
  }, [formData.id_municipio]);

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

  // Manejadores para cambio de cargo
  const handleCargoGovernadorChange = (e) => {
    const idCargo = e.target.value;
    setPapeletaGovernador(prev => ({ 
      ...prev, 
      id_cargo: idCargo,
      tipo_papeleta: 'SUBNACIONAL'
    }));
  };


  const handleCargoAsamblPoblacionChange = (e) => {
    const idCargo = e.target.value;
    setPapeletaAsamblPoblacion(prev => ({ 
      ...prev, 
      id_cargo: idCargo,
      tipo_papeleta: 'SUBNACIONAL'
    }));
  };

  const handleCargoAsamblTerritorioChange = (e) => {
    const idCargo = e.target.value;
    setPapeletaAsamblTerritorio(prev => ({ 
      ...prev, 
      id_cargo: idCargo,
      tipo_papeleta: 'SUBNACIONAL'
    }));
  };

  const handleVotoGovernadorChange = (idOrg, value) => {
    const numValue = value === '' ? 0 : Number(value) || 0;
    setPapeletaGovernador(prev => ({
      ...prev,
      votosPartido: {
        ...prev.votosPartido,
        [idOrg]: Math.max(0, numValue)
      }
    }));
  };

  const handleVotoAsamblRegionChange = (idOrg, value) => {
    const numValue = value === '' ? 0 : Number(value) || 0;
    setPapeletaAsamblPoblacion(prev => ({
      ...prev,
      votosPartido: {
        ...prev.votosPartido,
        [idOrg]: Math.max(0, numValue)
      }
    }));
  };

  const handleVotoAsamblPoblacionChange = (idOrg, value) => {
    const numValue = value === '' ? 0 : Number(value) || 0;
    setPapeletaAsamblPoblacion(prev => ({
      ...prev,
      votosPartido: {
        ...prev.votosPartido,
        [idOrg]: Math.max(0, numValue)
      }
    }));
  };

  const handleVotoAsamblTerritorioChange = (idOrg, value) => {
    const numValue = value === '' ? 0 : Number(value) || 0;
    setPapeletaAsamblTerritorio(prev => ({
      ...prev,
      votosPartido: {
        ...prev.votosPartido,
        [idOrg]: Math.max(0, numValue)
      }
    }));
  };

  const handleBlancosNulosGovernador = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setPapeletaGovernador(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleBlancosNulosAsamblRegion = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setPapeletaAsamblPoblacion(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleBlancosNulosAsamblPoblacion = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setPapeletaAsamblPoblacion(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleBlancosNulosAsamblTerritorio = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setPapeletaAsamblTerritorio(prev => ({
      ...prev,
      [field]: numValue
    }));
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
    
    if (!papeletaGovernador.id_cargo) {
      setError("❌ Debe seleccionar un cargo para GOBERNADOR");
      return;
    }

    if (!papeletaAsamblPoblacion.id_cargo) {
      setError("❌ Debe seleccionar un cargo para ASAMBLEISTA POBLACIÓN");
      return;
    }

    if (!papeletaAsamblTerritorio.id_cargo) {
      setError("❌ Debe seleccionar un cargo para ASAMBLEISTA TERRITORIO");
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id_usuario) {
      setError("❌ Usuario no autenticado");
      return;
    }

    // Validar total de votos
    const totalVotos = Object.values(papeletaGovernador.votosPartido).reduce((sum, v) => sum + (Number(v) || 0), 0) + 
                       (Number(papeletaGovernador.votos_blancos) || 0) + 
                       (Number(papeletaGovernador.votos_nulos) || 0);
    
    if (totalVotos > cantidadInscritos) {
      setError(`⚠️ Total de votos (${totalVotos}) no puede superar inscritos (${cantidadInscritos})`);
      return;
    }

    const totalVotosAsamblPoblacion = Object.values(papeletaAsamblPoblacion.votosPartido).reduce((sum, v) => sum + (Number(v) || 0), 0) + 
                                   (Number(papeletaAsamblPoblacion.votos_blancos) || 0) + 
                                   (Number(papeletaAsamblPoblacion.votos_nulos) || 0);
    
    if (totalVotosAsamblPoblacion > cantidadInscritos) {
      setError(`⚠️ Total de votos Asambleista Población (${totalVotosAsamblPoblacion}) no puede superar inscritos (${cantidadInscritos})`);
      return;
    }

    const totalVotosAsamblTerritorio = Object.values(papeletaAsamblTerritorio.votosPartido).reduce((sum, v) => sum + (Number(v) || 0), 0) + 
                                       (Number(papeletaAsamblTerritorio.votos_blancos) || 0) + 
                                       (Number(papeletaAsamblTerritorio.votos_nulos) || 0);
    
    if (totalVotosAsamblTerritorio > cantidadInscritos) {
      setError(`⚠️ Total de votos Asambleista Territorio (${totalVotosAsamblTerritorio}) no puede superar inscritos (${cantidadInscritos})`);
      return;
    }

    // Validación de tamaño de archivos (máximo 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (fileActa && fileActa.size > MAX_FILE_SIZE) {
      setError("❌ El archivo del acta excede 5MB");
      return;
    }
    if (fileHoja && fileHoja.size > MAX_FILE_SIZE) {
      setError("❌ El archivo de la hoja de trabajo excede 5MB");
      return;
    }

    // Preparar datos para enviar
    const formDataToSend = new FormData();
    formDataToSend.append('id_mesa', formData.id_mesa);
    formDataToSend.append('codigo_acta', formData.codigo_acta.trim());
    formDataToSend.append('total_actas', Number(formData.total_papeletas_utilizadas) || 0);
    formDataToSend.append('observaciones', formData.observaciones || '');
    formDataToSend.append('user_id', user.id_usuario);
    
    // GOBERNADOR
    formDataToSend.append('id_cargo_gobernador', papeletaGovernador.id_cargo);
    formDataToSend.append('tipo_papeleta_gobernador', papeletaGovernador.tipo_papeleta);
    formDataToSend.append('votos_blancos_gobernador', Number(papeletaGovernador.votos_blancos) || 0);
    formDataToSend.append('votos_nulos_gobernador', Number(papeletaGovernador.votos_nulos) || 0);
    formDataToSend.append('votos_partidos_gobernador', JSON.stringify(papeletaGovernador.votosPartido));
    
    // ASAMBLEISTA POBLACIÓN
    formDataToSend.append('id_cargo_asambl_poblacion', papeletaAsamblPoblacion.id_cargo);
    formDataToSend.append('tipo_papeleta_asambl_poblacion', papeletaAsamblPoblacion.tipo_papeleta);
    formDataToSend.append('votos_blancos_asambl_poblacion', Number(papeletaAsamblPoblacion.votos_blancos) || 0);
    formDataToSend.append('votos_nulos_asambl_poblacion', Number(papeletaAsamblPoblacion.votos_nulos) || 0);
    formDataToSend.append('votos_partidos_asambl_poblacion', JSON.stringify(papeletaAsamblPoblacion.votosPartido));
    
    // ASAMBLEISTA TERRITORIO
    formDataToSend.append('id_cargo_asambl_territorio', papeletaAsamblTerritorio.id_cargo);
    formDataToSend.append('tipo_papeleta_asambl_territorio', papeletaAsamblTerritorio.tipo_papeleta);
    formDataToSend.append('votos_blancos_asambl_territorio', Number(papeletaAsamblTerritorio.votos_blancos) || 0);
    formDataToSend.append('votos_nulos_asambl_territorio', Number(papeletaAsamblTerritorio.votos_nulos) || 0);
    formDataToSend.append('votos_partidos_asambl_territorio', JSON.stringify(papeletaAsamblTerritorio.votosPartido));
    
    if (fileActa) formDataToSend.append('f_acta', fileActa);
    if (fileHoja) formDataToSend.append('f_h_trabajo', fileHoja);

    setLoading(true);
    setError('');
    try {
      await api.post('/api/escrutinio/gobernacion', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("✅ Acta de Gobernación registrada exitosamente");
      navigate('/dashboard');
    } catch (err) {
      console.error("Error al guardar acta", err);
      const msg = err.response?.data?.detail || err.response?.data?.error || "❌ Error al guardar el acta. Intente nuevamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">🏛️ Ingreso de Acta - Gobernación</h1>
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
            <SelectField
              label="Recinto"
              value={formData.id_recinto}
              onChange={(e) => setFormData({ ...formData, id_recinto: e.target.value })}
              options={recintos}
              disabled={!formData.id_municipio}
            />
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

          {/* Código de Acta Común */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Código de Acta (para todas las votaciones) *</label>
              <input
                type="text"
                value={formData.codigo_acta}
                onChange={(e) => setFormData({ ...formData, codigo_acta: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Ej: ACTA-GOB-001"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Total de Papeletas Utilizadas *</label>
              <input
                type="number"
                min="0"
                value={formData.total_papeletas_utilizadas}
                onChange={(e) => setFormData({ ...formData, total_papeletas_utilizadas: Number(e.target.value) || 0 })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Ej: 150"
                required
              />
            </div>
          </div>

          {/* PAPELETA GOBERNADOR */}
          <div className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50 mb-6">
            <h2 className="text-lg font-bold text-blue-800 mb-4">🏛️ GOBERNADOR (LIBRE_GOB)</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-1">Cargo *</label>
              <select
                value={papeletaGovernador.id_cargo}
                onChange={handleCargoGovernadorChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecciona un cargo</option>
                {Object.entries(cargos)
                  .filter(([nombre]) => nombre.toLowerCase().includes('gobernador'))
                  .map(([nombre, id]) => (
                    <option key={id} value={id}>{nombre}</option>
                  ))}
              </select>
            </div>

            {Object.keys(organizaciones).length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-800 mb-3">Votos por Organización</h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(organizaciones)
                    .map(([nombre, id]) => (
                      <div key={id} className="flex items-center justify-between bg-white p-3 rounded border border-blue-200">
                        <span className="font-medium text-gray-700">{nombre}</span>
                        <input
                          type="number"
                          min="0"
                          value={papeletaGovernador.votosPartido[id] || 0}
                          onChange={(e) => handleVotoGovernadorChange(id, e.target.value)}
                          className="w-16 p-2 border border-gray-300 rounded text-right font-semibold"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Votos Blancos</label>
                <input
                  type="number"
                  min="0"
                  value={papeletaGovernador.votos_blancos}
                  onChange={(e) => handleBlancosNulosGovernador('votos_blancos', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Votos Nulos</label>
                <input
                  type="number"
                  min="0"
                  value={papeletaGovernador.votos_nulos}
                  onChange={(e) => handleBlancosNulosGovernador('votos_nulos', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                />
              </div>
            </div>

            <div className="bg-blue-100 border border-blue-300 rounded p-3">
              <p className="text-gray-700 font-bold">Total de Votos: {
                Object.values(papeletaGovernador.votosPartido).reduce((a,v)=>a+(Number(v)||0), 0) + 
                (Number(papeletaGovernador.votos_blancos) || 0) + 
                (Number(papeletaGovernador.votos_nulos) || 0)
              }</p>
            </div>
          </div>

          {/* PAPELETA ASAMBLEISTA POBLACIÓN */}
          <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50 mb-6">
            <h2 className="text-lg font-bold text-green-800 mb-4">🏛️ ASAMBLEISTA POR POBLACIÓN (LIBRE_A_R)</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-1">Cargo *</label>
              <select
                value={papeletaAsamblPoblacion.id_cargo}
                onChange={handleCargoAsamblPoblacionChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecciona un cargo</option>
                {Object.entries(cargos)
                  .filter(([nombre]) => nombre.toLowerCase().includes('población') || nombre.toLowerCase().includes('poblacion'))
                  .map(([nombre, id]) => (
                    <option key={id} value={id}>{nombre}</option>
                  ))}
              </select>
            </div>

            {Object.keys(organizaciones).length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-800 mb-3">Votos por Organización</h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(organizaciones)
                    .map(([nombre, id]) => (
                      <div key={id} className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                        <span className="font-medium text-gray-700">{nombre}</span>
                        <input
                          type="number"
                          min="0"
                          value={papeletaAsamblPoblacion.votosPartido[id] || 0}
                          onChange={(e) => handleVotoAsamblPoblacionChange(id, e.target.value)}
                          className="w-16 p-2 border border-gray-300 rounded text-right font-semibold"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Votos Blancos</label>
                <input
                  type="number"
                  min="0"
                  value={papeletaAsamblPoblacion.votos_blancos}
                  onChange={(e) => handleBlancosNulosAsamblPoblacion('votos_blancos', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Votos Nulos</label>
                <input
                  type="number"
                  min="0"
                  value={papeletaAsamblPoblacion.votos_nulos}
                  onChange={(e) => handleBlancosNulosAsamblPoblacion('votos_nulos', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                />
              </div>
            </div>

            <div className="bg-green-100 border border-green-300 rounded p-3">
              <p className="text-gray-700 font-bold">Total de Votos: {
                Object.values(papeletaAsamblPoblacion.votosPartido).reduce((a,v)=>a+(Number(v)||0), 0) + 
                (Number(papeletaAsamblPoblacion.votos_blancos) || 0) + 
                (Number(papeletaAsamblPoblacion.votos_nulos) || 0)
              }</p>
            </div>
          </div>

          {/* PAPELETA ASAMBLEISTA TERRITORIO */}
          <div className="border-2 border-orange-400 rounded-lg p-4 bg-orange-50 mb-6">
            <h2 className="text-lg font-bold text-orange-800 mb-4">🏛️ ASAMBLEISTA POR TERRITORIO (LIBRE_A_T)</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-1">Cargo *</label>
              <select
                value={papeletaAsamblTerritorio.id_cargo}
                onChange={handleCargoAsamblTerritorioChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecciona un cargo</option>
                {Object.entries(cargos)
                  .filter(([nombre]) => nombre.toLowerCase().includes('territorio'))
                  .map(([nombre, id]) => (
                    <option key={id} value={id}>{nombre}</option>
                  ))}
              </select>
            </div>

            {Object.keys(organizaciones).length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-800 mb-3">Votos por Organización</h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(organizaciones)
                    .map(([nombre, id]) => (
                      <div key={id} className="flex items-center justify-between bg-white p-3 rounded border border-orange-200">
                        <span className="font-medium text-gray-700">{nombre}</span>
                        <input
                          type="number"
                          min="0"
                          value={papeletaAsamblTerritorio.votosPartido[id] || 0}
                          onChange={(e) => handleVotoAsamblTerritorioChange(id, e.target.value)}
                          className="w-16 p-2 border border-gray-300 rounded text-right font-semibold"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Votos Blancos</label>
                <input
                  type="number"
                  min="0"
                  value={papeletaAsamblTerritorio.votos_blancos}
                  onChange={(e) => handleBlancosNulosAsamblTerritorio('votos_blancos', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Votos Nulos</label>
                <input
                  type="number"
                  min="0"
                  value={papeletaAsamblTerritorio.votos_nulos}
                  onChange={(e) => handleBlancosNulosAsamblTerritorio('votos_nulos', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                />
              </div>
            </div>

            <div className="bg-orange-100 border border-orange-300 rounded p-3">
              <p className="text-gray-700 font-bold">Total de Votos: {
                Object.values(papeletaAsamblTerritorio.votosPartido).reduce((a,v)=>a+(Number(v)||0), 0) + 
                (Number(papeletaAsamblTerritorio.votos_blancos) || 0) + 
                (Number(papeletaAsamblTerritorio.votos_nulos) || 0)
              }</p>
            </div>
          </div>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">📄 Imagen del Acta</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFileActa(e.target.files[0])}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">📝 Hoja de Trabajo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFileHoja(e.target.files[0])}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Acta Completa'}
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
