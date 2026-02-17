// frontend/src/pages/Escrutinio.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Escrutinio() {
  const navigate = useNavigate();

  // Estados para selección geográfica
  const [departamentos, setDepartamentos] = useState({});
  const [provincias, setProvincias] = useState({});
  const [municipios, setMunicipios] = useState({});
  const [recintos, setRecintos] = useState({});
  const [mesas, setMesas] = useState({});
  const [cargos, setCargos] = useState({});
  const [organizaciones, setOrganizaciones] = useState({});

  // Estados de formulario (¡todos inicializados!)
  const [formData, setFormData] = useState({
    id_departamento: '',
    id_provincia: '',
    id_municipio: '',
    id_recinto: '',
    id_mesa: '',
    observaciones: ''
  });

  // Estados para tres papeletas
  const [papeletaGovernador, setPapeletaGovernador] = useState({
    codigo_acta: '',
    id_cargo: '',
    tipo_papeleta: 'SUBNACIONAL',
    votos_blancos: 0,
    votos_nulos: 0,
    votosPartido: {}
  });

  const [papeletaAlcalde, setPapeletaAlcalde] = useState({
    codigo_acta: '',
    id_cargo: '',
    tipo_papeleta: 'MUNICIPAL',
    votos_blancos: 0,
    votos_nulos: 0,
    votosPartido: {}
  });

  const [papeletaConcejal, setPapeletaConcejal] = useState({
    codigo_acta: '',
    id_cargo: '',
    tipo_papeleta: 'MUNICIPAL',
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
        Object.values(orgRes.data).forEach(id => { votos[id] = 0; });

        // Inicializar votos para las tres papeletas
        setPapeletaGovernador(prev => ({ ...prev, votosPartido: votos }));
        setPapeletaAlcalde(prev => ({ ...prev, votosPartido: votos }));
        setPapeletaConcejal(prev => ({ ...prev, votosPartido: votos }));
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
      // Limpiar dependencias inferiores
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
      // Limpiar dependencias inferiores
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
      // Limpiar dependencias inferiores
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
      // Limpiar dependencias inferiores
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

  // Manejadores para cambio de cargo - auto-llena el tipo de papeleta
  const handleCargoGovernadorChange = (e) => {
    const idCargo = e.target.value;
    setPapeletaGovernador(prev => ({ 
      ...prev, 
      id_cargo: idCargo,
      tipo_papeleta: 'SUBNACIONAL'
    }));
  };

  const handleCargoAlcaldeChange = (e) => {
    const idCargo = e.target.value;
    setPapeletaAlcalde(prev => ({ 
      ...prev, 
      id_cargo: idCargo,
      tipo_papeleta: 'MUNICIPAL'
    }));
  };

  const handleCargoConcejaiChange = (e) => {
    const idCargo = e.target.value;
    setPapeletaConcejal(prev => ({ 
      ...prev, 
      id_cargo: idCargo,
      tipo_papeleta: 'MUNICIPAL'
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

  const handleVotoAlcaldeChange = (idOrg, value) => {
    const numValue = value === '' ? 0 : Number(value) || 0;
    setPapeletaAlcalde(prev => ({
      ...prev,
      votosPartido: {
        ...prev.votosPartido,
        [idOrg]: Math.max(0, numValue)
      }
    }));
  };

  const handleVotoConcejaiChange = (idOrg, value) => {
    const numValue = value === '' ? 0 : Number(value) || 0;
    setPapeletaConcejal(prev => ({
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

  const handleBlancosNulosAlcalde = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setPapeletaAlcalde(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleBlancosNulosConcejal = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setPapeletaConcejal(prev => ({
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
    
    if (!papeletaGovernador.codigo_acta.trim()) {
      setError("❌ El código de acta para Gobernador es obligatorio");
      return;
    }
    if (!papeletaAlcalde.codigo_acta.trim()) {
      setError("❌ El código de acta para Alcalde es obligatorio");
      return;
    }
    if (!papeletaConcejal.codigo_acta.trim()) {
      setError("❌ El código de acta para Concejal es obligatorio");
      return;
    }
    
    if (!papeletaGovernador.id_cargo) {
      setError("❌ Debe seleccionar un cargo para la papeleta de Gobernador");
      return;
    }
    if (!papeletaAlcalde.id_cargo) {
      setError("❌ Debe seleccionar un cargo para la papeleta de Alcalde");
      return;
    }
    if (!papeletaConcejal.id_cargo) {
      setError("❌ Debe seleccionar un cargo para la papeleta de Concejal");
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id_usuario) {
      setError("❌ Usuario no autenticado");
      return;
    }

    // Validar totales de votos para las tres papeletas
    const totalVotosGob = Object.values(papeletaGovernador.votosPartido).reduce((sum, v) => sum + (Number(v) || 0), 0) + 
                         (Number(papeletaGovernador.votos_blancos) || 0) + (Number(papeletaGovernador.votos_nulos) || 0);
    const totalVotosAlc = Object.values(papeletaAlcalde.votosPartido).reduce((sum, v) => sum + (Number(v) || 0), 0) + 
                         (Number(papeletaAlcalde.votos_blancos) || 0) + (Number(papeletaAlcalde.votos_nulos) || 0);
    const totalVotosCon = Object.values(papeletaConcejal.votosPartido).reduce((sum, v) => sum + (Number(v) || 0), 0) + 
                         (Number(papeletaConcejal.votos_blancos) || 0) + (Number(papeletaConcejal.votos_nulos) || 0);
    
    if (totalVotosGob > cantidadInscritos) {
      setError(`⚠️ Gobernador: Total de votos (${totalVotosGob}) no puede superar inscritos (${cantidadInscritos})`);
      return;
    }
    if (totalVotosAlc > cantidadInscritos) {
      setError(`⚠️ Alcalde: Total de votos (${totalVotosAlc}) no puede superar inscritos (${cantidadInscritos})`);
      return;
    }
    if (totalVotosCon > cantidadInscritos) {
      setError(`⚠️ Concejal: Total de votos (${totalVotosCon}) no puede superar inscritos (${cantidadInscritos})`);
      return;
    }

    // Validación de tamaño de archivos (máximo 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (fileActa && fileActa.size > MAX_FILE_SIZE) {
      setError("❌ El archivo del acta excede 5MB");
      return;
    }
    if (fileHoja && fileHoja.size > MAX_FILE_SIZE) {
      setError("❌ El archivo de la hoja de trabajo excede 5MB");
      return;
    }

    // Preparar datos para las tres papeletas
    const formDataToSend = new FormData();
    formDataToSend.append('id_mesa', formData.id_mesa);
    formDataToSend.append('observaciones', formData.observaciones || '');
    formDataToSend.append('user_id', user.id_usuario);
    
    // PAPELETA GOBERNADOR
    formDataToSend.append('gobernador_codigo_acta', papeletaGovernador.codigo_acta.trim());
    formDataToSend.append('gobernador_cargo', papeletaGovernador.id_cargo);
    formDataToSend.append('gobernador_blancos', Number(papeletaGovernador.votos_blancos) || 0);
    formDataToSend.append('gobernador_nulos', Number(papeletaGovernador.votos_nulos) || 0);
    formDataToSend.append('gobernador_votos', JSON.stringify(papeletaGovernador.votosPartido));
    
    // PAPELETA ALCALDE
    formDataToSend.append('alcalde_codigo_acta', papeletaAlcalde.codigo_acta.trim());
    formDataToSend.append('alcalde_cargo', papeletaAlcalde.id_cargo);
    formDataToSend.append('alcalde_blancos', Number(papeletaAlcalde.votos_blancos) || 0);
    formDataToSend.append('alcalde_nulos', Number(papeletaAlcalde.votos_nulos) || 0);
    formDataToSend.append('alcalde_votos', JSON.stringify(papeletaAlcalde.votosPartido));
    
    // PAPELETA CONCEJAL
    formDataToSend.append('concejal_codigo_acta', papeletaConcejal.codigo_acta.trim());
    formDataToSend.append('concejal_cargo', papeletaConcejal.id_cargo);
    formDataToSend.append('concejal_blancos', Number(papeletaConcejal.votos_blancos) || 0);
    formDataToSend.append('concejal_nulos', Number(papeletaConcejal.votos_nulos) || 0);
    formDataToSend.append('concejal_votos', JSON.stringify(papeletaConcejal.votosPartido));
    
    if (fileActa) formDataToSend.append('f_acta', fileActa);
    if (fileHoja) formDataToSend.append('f_h_trabajo', fileHoja);

    setLoading(true);
    setError('');
    try {
      await api.post('/api/escrutinio/triple-papeleta', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("✅ Las tres actas registradas exitosamente");
      navigate('/dashboard');
    } catch (err) {
      console.error("Error al guardar actas", err);
      const msg = err.response?.data?.detail || err.response?.data?.error || "❌ Error al guardar las actas. Intente nuevamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">🗳️ Ingreso de Acta de Escrutinio</h1>
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

          {/* Código de acta - ¡CAMPO OBLIGATORIO! */}

          {/* TRES PAPELETAS - GOBERNADOR, ALCALDE Y CONCEJAL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            
            {/* PAPELETA GOBERNADOR */}
            <div className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50">
              <h2 className="text-base font-bold text-blue-800 mb-3">🏛️ GOBERNADOR</h2>
              
              <div className="mb-3">
                <label className="block text-gray-700 font-medium mb-1 text-sm">Código de Acta *</label>
                <input
                  type="text"
                  value={papeletaGovernador.codigo_acta}
                  onChange={(e) => setPapeletaGovernador(prev => ({ ...prev, codigo_acta: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="ACTA-GOB-001"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 font-medium mb-1 text-sm">Cargo *</label>
                <select
                  value={papeletaGovernador.id_cargo}
                  onChange={handleCargoGovernadorChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Selecciona</option>
                  {Object.entries(cargos)
                    .filter(([nombre]) => nombre.toLowerCase().includes('gobernador'))
                    .map(([nombre, id]) => (
                      <option key={id} value={id}>{nombre}</option>
                    ))}
                </select>
              </div>

              {Object.keys(organizaciones).length > 0 && (
                <div className="mb-3">
                  <h4 className="font-bold text-gray-800 mb-2 text-xs">Votos</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(organizaciones)
                      .filter(([nombre]) => nombre.toLowerCase().includes('libre_gob'))
                      .map(([nombre, id]) => (
                        <div key={id} className="flex items-center justify-between bg-white p-1 rounded border border-blue-200 text-sm">
                          <span className="font-medium text-gray-700">{nombre}</span>
                          <input
                            type="number"
                            min="0"
                            value={papeletaGovernador.votosPartido[id] || 0}
                            onChange={(e) => handleVotoGovernadorChange(id, e.target.value)}
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
                    value={papeletaGovernador.votos_blancos}
                    onChange={(e) => handleBlancosNulosGovernador('votos_blancos', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-center font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Nulos</label>
                  <input
                    type="number"
                    min="0"
                    value={papeletaGovernador.votos_nulos}
                    onChange={(e) => handleBlancosNulosGovernador('votos_nulos', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-center font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="bg-blue-100 border border-blue-300 rounded p-2 text-xs">
                <p className="text-gray-700"><span className="font-bold">Total:</span> {
                  Object.values(papeletaGovernador.votosPartido).reduce((a,v)=>a+(Number(v)||0), 0) + 
                  (Number(papeletaGovernador.votos_blancos) || 0) + 
                  (Number(papeletaGovernador.votos_nulos) || 0)
                }</p>
              </div>
            </div>

            {/* PAPELETA ALCALDE */}
            <div className="border-2 border-orange-400 rounded-lg p-4 bg-orange-50">
              <h2 className="text-base font-bold text-orange-800 mb-3">🏘️ ALCALDE</h2>
              
              <div className="mb-3">
                <label className="block text-gray-700 font-medium mb-1 text-sm">Código de Acta *</label>
                <input
                  type="text"
                  value={papeletaAlcalde.codigo_acta}
                  onChange={(e) => setPapeletaAlcalde(prev => ({ ...prev, codigo_acta: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="ACTA-ALC-001"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 font-medium mb-1 text-sm">Cargo *</label>
                <select
                  value={papeletaAlcalde.id_cargo}
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
                  <h4 className="font-bold text-gray-800 mb-2 text-xs">Votos</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(organizaciones)
                      .filter(([nombre]) => nombre.toLowerCase().includes('libre_alca'))
                      .map(([nombre, id]) => (
                        <div key={id} className="flex items-center justify-between bg-white p-1 rounded border border-orange-200 text-sm">
                          <span className="font-medium text-gray-700">{nombre}</span>
                          <input
                            type="number"
                            min="0"
                            value={papeletaAlcalde.votosPartido[id] || 0}
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
                    value={papeletaAlcalde.votos_blancos}
                    onChange={(e) => handleBlancosNulosAlcalde('votos_blancos', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-center font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Nulos</label>
                  <input
                    type="number"
                    min="0"
                    value={papeletaAlcalde.votos_nulos}
                    onChange={(e) => handleBlancosNulosAlcalde('votos_nulos', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-center font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="bg-orange-100 border border-orange-300 rounded p-2 text-xs">
                <p className="text-gray-700"><span className="font-bold">Total:</span> {
                  Object.values(papeletaAlcalde.votosPartido).reduce((a,v)=>a+(Number(v)||0), 0) + 
                  (Number(papeletaAlcalde.votos_blancos) || 0) + 
                  (Number(papeletaAlcalde.votos_nulos) || 0)
                }</p>
              </div>
            </div>

            {/* PAPELETA CONCEJAL */}
            <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50">
              <h2 className="text-base font-bold text-green-800 mb-3">🏛️ CONCEJAL</h2>
              
              <div className="mb-3">
                <label className="block text-gray-700 font-medium mb-1 text-sm">Código de Acta *</label>
                <input
                  type="text"
                  value={papeletaConcejal.codigo_acta}
                  onChange={(e) => setPapeletaConcejal(prev => ({ ...prev, codigo_acta: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="ACTA-CON-001"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 font-medium mb-1 text-sm">Cargo *</label>
                <select
                  value={papeletaConcejal.id_cargo}
                  onChange={handleCargoConcejaiChange}
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
                  <h4 className="font-bold text-gray-800 mb-2 text-xs">Votos</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(organizaciones)
                      .filter(([nombre]) => nombre.toLowerCase().includes('libre_cons'))
                      .map(([nombre, id]) => (
                        <div key={id} className="flex items-center justify-between bg-white p-1 rounded border border-green-200 text-sm">
                          <span className="font-medium text-gray-700">{nombre}</span>
                          <input
                            type="number"
                            min="0"
                            value={papeletaConcejal.votosPartido[id] || 0}
                            onChange={(e) => handleVotoConcejaiChange(id, e.target.value)}
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
                    value={papeletaConcejal.votos_blancos}
                    onChange={(e) => handleBlancosNulosConcejal('votos_blancos', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-center font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Nulos</label>
                  <input
                    type="number"
                    min="0"
                    value={papeletaConcejal.votos_nulos}
                    onChange={(e) => handleBlancosNulosConcejal('votos_nulos', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-center font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="bg-green-100 border border-green-300 rounded p-2 text-xs">
                <p className="text-gray-700"><span className="font-bold">Total:</span> {
                  Object.values(papeletaConcejal.votosPartido).reduce((a,v)=>a+(Number(v)||0), 0) + 
                  (Number(papeletaConcejal.votos_blancos) || 0) + 
                  (Number(papeletaConcejal.votos_nulos) || 0)
                }</p>
              </div>
            </div>
          </div>

          {/* Subida de archivos */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">📄 Imagen del Acta (f_acta)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFileActa(e.target.files[0])}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">📝 Hoja de Trabajo (f_h_trabajo)</label>
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
              {loading ? 'Guardando...' : 'Guardar Acta'}
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

function InputField({ label, name, type = "text", min, value, onChange, required = false }) {
  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1">{label}</label>
      <input
        type={type}
        name={name}
        min={min}
        value={value}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        required={required}
      />
    </div>
  );
}

function ResumenVotos({ votosPartidos, votos_blancos, votos_nulos, cantidadInscritos }) {
  const totalPartidos = Object.values(votosPartidos).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const totalBlancos = Number(votos_blancos) || 0;
  const totalNulos = Number(votos_nulos) || 0;
  const totalVotos = totalPartidos + totalBlancos + totalNulos;
  const votosFaltantes = cantidadInscritos - totalVotos;
  
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
      <h3 className="font-bold text-emerald-800 mb-3">📊 Resumen de Votos</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-emerald-300">
          <p className="text-xs text-gray-600 uppercase font-semibold">Partidos</p>
          <p className="text-2xl font-bold text-emerald-700">{totalPartidos}</p>
        </div>
        <div className="bg-white p-3 rounded border border-emerald-300">
          <p className="text-xs text-gray-600 uppercase font-semibold">Blancos</p>
          <p className="text-2xl font-bold text-blue-700">{totalBlancos}</p>
        </div>
        <div className="bg-white p-3 rounded border border-emerald-300">
          <p className="text-xs text-gray-600 uppercase font-semibold">Nulos</p>
          <p className="text-2xl font-bold text-red-700">{totalNulos}</p>
        </div>
        <div className={`p-3 rounded border ${votosFaltantes === 0 ? 'bg-green-50 border-green-300' : votosFaltantes > 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'}`}>
          <p className="text-xs text-gray-600 uppercase font-semibold">Faltantes/Exceso</p>
          <p className={`text-2xl font-bold ${votosFaltantes === 0 ? 'text-green-700' : votosFaltantes > 0 ? 'text-yellow-700' : 'text-red-700'}`}>
            {votosFaltantes > 0 ? `-${votosFaltantes}` : votosFaltantes < 0 ? `+${Math.abs(votosFaltantes)}` : '✓'}
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-emerald-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Total ingresado:</span> {totalVotos} / {cantidadInscritos} inscritos
        </p>
      </div>
    </div>
  );
}