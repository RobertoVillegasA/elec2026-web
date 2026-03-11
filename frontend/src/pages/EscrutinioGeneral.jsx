// frontend/src/pages/EscrutinioGeneral.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function EscrutinioGeneral() {
  const navigate = useNavigate();

  // Estados para selección geográfica
  const [departamentos, setDepartamentos] = useState({});
  const [provincias, setProvincias] = useState({});
  const [municipios, setMunicipios] = useState({});
  const [recintos, setRecintos] = useState({});
  const [mesas, setMesas] = useState({});
  const [cargos, setCargos] = useState({});
  const [organizaciones, setOrganizaciones] = useState({});

  // Búsqueda de recinto
  const [busquedaRecinto, setBusquedaRecinto] = useState('');
  const [recintosFiltrados, setRecintosFiltrados] = useState([]);

  // Estado para selección de tipo de escrutinio
  const [tipoEscrutinio, setTipoEscrutinio] = useState('AMBOS'); // 'AMBOS', 'SOLO_MUNICIPAL', 'SOLO_GOBERNACION'

  // Estado para ACTA MUNICIPAL (Alcalde + Concejal)
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

  // Estado para ACTA DE GOBERNACION (Gobernador + Asambleístas)
  const [actaGobernacion, setActaGobernacion] = useState({
    id_cargo_gobernador: '',
    id_cargo_asam_pob: '',
    id_cargo_asam_terr: '',
    tipo_papeleta: 'SUBNACIONAL',
    votos_blancos_gobernador: 0,
    votos_nulos_gobernador: 0,
    votos_blancos_asam_pob: 0,
    votos_nulos_asam_pob: 0,
    votos_blancos_asam_terr: 0,
    votos_nulos_asam_terr: 0,
    votosGobernador: {},
    votosAsamPob: {},
    votosAsamTerr: {}
  });

  // Estado del formulario principal
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cantidadInscritos, setCantidadInscritos] = useState(0);

  // Archivos - Múltiples imágenes
  const [filesActa, setFilesActa] = useState([]);
  const [filesHoja, setFilesHoja] = useState([]);
  const [previewsActa, setPreviewsActa] = useState([]);
  const [previewsHoja, setPreviewsHoja] = useState([]);

  // Cargar catálogos iniciales
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        console.log("Cargando catálogos...");
        
        const deptoRes = await api.get('/api/catalog?table=departamentos');
        console.log("Departamentos:", deptoRes.data);
        setDepartamentos(deptoRes.data || {});

        const orgRes = await api.get('/api/catalog?table=organizaciones_politicas');
        console.log("Organizaciones:", orgRes.data);
        setOrganizaciones(orgRes.data || {});

        const cargoRes = await api.get('/api/catalog?table=cargos');
        console.log("Cargos:", cargoRes.data);
        setCargos(cargoRes.data || {});

        // Inicializar votos con 0 para cada organización
        const votos = {};
        if (orgRes.data && typeof orgRes.data === 'object') {
          Object.values(orgRes.data).forEach(id => {
            if (id) votos[id] = 0;
          });
        }
        console.log("Votos inicializados:", votos);

        // Detectar y asignar cargos automáticamente
        let idCargoAlcalde = '';
        let idCargoConcejal = '';
        let idCargoGobernador = '';
        let idCargoAsamPob = '';
        let idCargoAsamTerr = '';

        if (cargoRes.data && typeof cargoRes.data === 'object') {
          Object.entries(cargoRes.data).forEach(([nombre, id]) => {
            const nombreLower = nombre.toLowerCase();
            
            // Detectar ALCALDE
            if (nombreLower.includes('alcalde')) {
              idCargoAlcalde = id;
            }
            // Detectar CONCEJAL
            else if (nombreLower.includes('concejal')) {
              idCargoConcejal = id;
            }
            // Detectar GOBERNADOR
            else if (nombreLower.includes('gobernador')) {
              idCargoGobernador = id;
            }
            // Detectar ASAMBLEISTA POR POBLACION (variaciones: asamblea poblacion, asambleísta población, etc.)
            else if ((nombreLower.includes('asamble') || nombreLower.includes('asamblea')) && 
                     (nombreLower.includes('poblacion') || nombreLower.includes('población'))) {
              idCargoAsamPob = id;
            }
            // Detectar ASAMBLEISTA POR TERRITORIO (variaciones: asamblea territorio, asambleísta territorio, etc.)
            else if ((nombreLower.includes('asamble') || nombreLower.includes('asamblea')) && 
                     (nombreLower.includes('territorio') || nombreLower.includes('territorial'))) {
              idCargoAsamTerr = id;
            }
          });
        }
        
        console.log("Cargos detectados:", {
          Alcalde: idCargoAlcalde,
          Concejal: idCargoConcejal,
          Gobernador: idCargoGobernador,
          AsamPob: idCargoAsamPob,
          AsamTerr: idCargoAsamTerr
        });

        setActaMunicipal(prev => ({
          ...prev,
          votosAlcalde: {...votos},
          votosConcejal: {...votos},
          id_cargo_alcalde: idCargoAlcalde,
          id_cargo_concejal: idCargoConcejal
        }));

        setActaGobernacion(prev => ({
          ...prev,
          votosGobernador: {...votos},
          votosAsamPob: {...votos},
          votosAsamTerr: {...votos},
          id_cargo_gobernador: idCargoGobernador,
          id_cargo_asam_pob: idCargoAsamPob,
          id_cargo_asam_terr: idCargoAsamTerr
        }));
        
        console.log("Catálogos cargados exitosamente");
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar catálogos", err);
        setError("❌ Error al cargar los catálogos: " + (err.message || 'Error desconocido'));
        setLoading(false);
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

  // Manejadores para votos MUNICIPALES
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

  // Manejadores para votos de GOBERNACION
  const handleVotoGobernadorChange = (idOrg, value) => {
    const numValue = value === '' ? 0 : Number(value) || 0;
    setActaGobernacion(prev => ({
      ...prev,
      votosGobernador: {
        ...prev.votosGobernador,
        [idOrg]: Math.max(0, numValue)
      }
    }));
  };

  const handleVotoAsamPobChange = (idOrg, value) => {
    const numValue = value === '' ? 0 : Number(value) || 0;
    setActaGobernacion(prev => ({
      ...prev,
      votosAsamPob: {
        ...prev.votosAsamPob,
        [idOrg]: Math.max(0, numValue)
      }
    }));
  };

  const handleVotoAsamTerrChange = (idOrg, value) => {
    const numValue = value === '' ? 0 : Number(value) || 0;
    setActaGobernacion(prev => ({
      ...prev,
      votosAsamTerr: {
        ...prev.votosAsamTerr,
        [idOrg]: Math.max(0, numValue)
      }
    }));
  };

  const handleBlancosNulosGobernador = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setActaGobernacion(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleBlancosNulosAsamPob = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setActaGobernacion(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleBlancosNulosAsamTerr = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setActaGobernacion(prev => ({
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

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id_usuario) {
      setError("❌ Usuario no autenticado");
      return;
    }

    // Validar según tipo de escrutinio
    if (tipoEscrutinio === 'AMBOS' || tipoEscrutinio === 'SOLO_MUNICIPAL') {
      // Validar totales de votos MUNICIPALES
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
    }

    if (tipoEscrutinio === 'AMBOS' || tipoEscrutinio === 'SOLO_GOBERNACION') {
      // Validar totales de votos de GOBERNACION
      const totalVotosGobernador = Object.values(actaGobernacion.votosGobernador).reduce((sum, v) => sum + (Number(v) || 0), 0) +
                                   (Number(actaGobernacion.votos_blancos_gobernador) || 0) +
                                   (Number(actaGobernacion.votos_nulos_gobernador) || 0);

      const totalVotosAsamPob = Object.values(actaGobernacion.votosAsamPob).reduce((sum, v) => sum + (Number(v) || 0), 0) +
                                (Number(actaGobernacion.votos_blancos_asam_pob) || 0) +
                                (Number(actaGobernacion.votos_nulos_asam_pob) || 0);

      const totalVotosAsamTerr = Object.values(actaGobernacion.votosAsamTerr).reduce((sum, v) => sum + (Number(v) || 0), 0) +
                                 (Number(actaGobernacion.votos_blancos_asam_terr) || 0) +
                                 (Number(actaGobernacion.votos_nulos_asam_terr) || 0);

      if (totalVotosGobernador > cantidadInscritos) {
        setError(`⚠️ Gobernador: Total de votos (${totalVotosGobernador}) no puede superar inscritos (${cantidadInscritos})`);
        return;
      }

      if (totalVotosAsamPob > cantidadInscritos) {
        setError(`⚠️ Asam. Población: Total de votos (${totalVotosAsamPob}) no puede superar inscritos (${cantidadInscritos})`);
        return;
      }

      if (totalVotosAsamTerr > cantidadInscritos) {
        setError(`⚠️ Asam. Territorio: Total de votos (${totalVotosAsamTerr}) no puede superar inscritos (${cantidadInscritos})`);
        return;
      }
    }

    // Validación de tamaño de archivos (máximo 5MB por archivo)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_FILES = 5;
    
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
    formDataToSend.append('tipo_escrutinio', tipoEscrutinio);

    // Datos MUNICIPALES
    if (tipoEscrutinio === 'AMBOS' || tipoEscrutinio === 'SOLO_MUNICIPAL') {
      formDataToSend.append('id_cargo_alcalde', actaMunicipal.id_cargo_alcalde);
      formDataToSend.append('id_cargo_concejal', actaMunicipal.id_cargo_concejal);
      formDataToSend.append('votos_blancos_alcalde', Number(actaMunicipal.votos_blancos_alcalde) || 0);
      formDataToSend.append('votos_nulos_alcalde', Number(actaMunicipal.votos_nulos_alcalde) || 0);
      formDataToSend.append('votos_blancos_concejal', Number(actaMunicipal.votos_blancos_concejal) || 0);
      formDataToSend.append('votos_nulos_concejal', Number(actaMunicipal.votos_nulos_concejal) || 0);

      const votosAlcaldeFiltrados = {};
      for (const [id, valor] of Object.entries(actaMunicipal.votosAlcalde)) {
        const numValor = Number(valor) || 0;
        if (numValor > 0) {
          votosAlcaldeFiltrados[id] = numValor;
        }
      }
      formDataToSend.append('votos_alcalde', JSON.stringify(votosAlcaldeFiltrados));

      const votosConcejalFiltrados = {};
      for (const [id, valor] of Object.entries(actaMunicipal.votosConcejal)) {
        const numValor = Number(valor) || 0;
        if (numValor > 0) {
          votosConcejalFiltrados[id] = numValor;
        }
      }
      formDataToSend.append('votos_concejal', JSON.stringify(votosConcejalFiltrados));
    }

    // Datos de GOBERNACION
    if (tipoEscrutinio === 'AMBOS' || tipoEscrutinio === 'SOLO_GOBERNACION') {
      formDataToSend.append('id_cargo_gobernador', actaGobernacion.id_cargo_gobernador);
      formDataToSend.append('id_cargo_gob', actaGobernacion.id_cargo_gobernador);  // Alias para BD
      formDataToSend.append('id_cargo_asam_pob', actaGobernacion.id_cargo_asam_pob);
      formDataToSend.append('id_cargo_asam_terr', actaGobernacion.id_cargo_asam_terr);
      formDataToSend.append('votos_blancos_gobernador', Number(actaGobernacion.votos_blancos_gobernador) || 0);
      formDataToSend.append('votos_nulos_gobernador', Number(actaGobernacion.votos_nulos_gobernador) || 0);
      formDataToSend.append('votos_blancos_asam_pob', Number(actaGobernacion.votos_blancos_asam_pob) || 0);
      formDataToSend.append('votos_nulos_asam_pob', Number(actaGobernacion.votos_nulos_asam_pob) || 0);
      formDataToSend.append('votos_blancos_asam_terr', Number(actaGobernacion.votos_blancos_asam_terr) || 0);
      formDataToSend.append('votos_nulos_asam_terr', Number(actaGobernacion.votos_nulos_asam_terr) || 0);

      const votosGobernadorFiltrados = {};
      for (const [id, valor] of Object.entries(actaGobernacion.votosGobernador)) {
        const numValor = Number(valor) || 0;
        if (numValor > 0) {
          votosGobernadorFiltrados[id] = numValor;
        }
      }
      formDataToSend.append('votos_gobernador', JSON.stringify(votosGobernadorFiltrados));

      const votosAsamPobFiltrados = {};
      for (const [id, valor] of Object.entries(actaGobernacion.votosAsamPob)) {
        const numValor = Number(valor) || 0;
        if (numValor > 0) {
          votosAsamPobFiltrados[id] = numValor;
        }
      }
      formDataToSend.append('votos_asam_pob', JSON.stringify(votosAsamPobFiltrados));

      const votosAsamTerrFiltrados = {};
      for (const [id, valor] of Object.entries(actaGobernacion.votosAsamTerr)) {
        const numValor = Number(valor) || 0;
        if (numValor > 0) {
          votosAsamTerrFiltrados[id] = numValor;
        }
      }
      formDataToSend.append('votos_asam_terr', JSON.stringify(votosAsamTerrFiltrados));
    }

    // Agregar múltiples archivos
    filesActa.forEach(file => {
      formDataToSend.append('f_acta', file);
    });
    
    filesHoja.forEach(file => {
      formDataToSend.append('f_h_trabajo', file);
    });

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/escrutinio/general', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log("Respuesta del servidor:", response.data);
      alert("✅ Acta registrada exitosamente");
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

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">⏳ Cargando formularios...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🗳️ Escrutinio General</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            ↩️ Volver al Dashboard
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border border-red-200">{error}</div>}

        {/* Información importante */}
        <div className="mb-6 bg-emerald-50 p-4 rounded-lg border-2 border-emerald-300">
          <h3 className="font-bold text-emerald-800 mb-2">📌 Información Importante</h3>
          <ul className="text-sm text-emerald-700 space-y-1">
            <li>• Todas las actas se guardan como <span className="font-bold">UNA SOLA ACTA</span> con tipo <span className="font-bold bg-emerald-100 px-2 py-0.5 rounded">SUBNACIONAL</span></li>
            <li>• Los votos de <span className="font-semibold">Alcalde y Concejal</span> se almacenan junto con los de <span className="font-semibold">Gobernador y Asambleístas</span></li>
            <li>• Los resultados municipales muestran los votos de Alcalde/Concejal de actas MUNICIPALES y SUBNACIONALES</li>
            <li>• Los resultados subnacionales muestran los votos de Gobernador/Asambleístas de actas SUBNACIONALES</li>
          </ul>
        </div>

        {/* Selector de Tipo de Escrutinio */}
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label className="block text-gray-700 font-semibold mb-2">📋 Tipo de Escrutinio</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTipoEscrutinio('AMBOS')}
              className={`p-3 rounded-lg border-2 font-medium transition ${
                tipoEscrutinio === 'AMBOS'
                  ? 'border-blue-600 bg-blue-100 text-blue-800'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400'
              }`}
            >
              🗳️ Ambos (Municipal + Gobernación)
            </button>
            <button
              type="button"
              onClick={() => setTipoEscrutinio('SOLO_MUNICIPAL')}
              className={`p-3 rounded-lg border-2 font-medium transition ${
                tipoEscrutinio === 'SOLO_MUNICIPAL'
                  ? 'border-orange-600 bg-orange-100 text-orange-800'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-orange-400'
              }`}
            >
              🏘️ Solo Municipal
            </button>
            <button
              type="button"
              onClick={() => setTipoEscrutinio('SOLO_GOBERNACION')}
              className={`p-3 rounded-lg border-2 font-medium transition ${
                tipoEscrutinio === 'SOLO_GOBERNACION'
                  ? 'border-green-600 bg-green-100 text-green-800'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-green-400'
              }`}
            >
              🏛️ Solo Gobernación
            </button>
          </div>
        </div>

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

          {/* Código de Acta y Total Papeletas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Código de Acta *</label>
              <input
                type="text"
                value={formData.codigo_acta}
                onChange={(e) => setFormData({ ...formData, codigo_acta: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Ej: ACTA-001"
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

          {/* SECCION MUNICIPAL */}
          {(tipoEscrutinio === 'AMBOS' || tipoEscrutinio === 'SOLO_MUNICIPAL') && (
            <div className="mb-6 border-2 border-orange-400 rounded-lg p-4 bg-orange-50">
              <h2 className="text-xl font-bold text-orange-800 mb-4">🏘️ VOTACIÓN MUNICIPAL</h2>
              <p className="text-sm text-orange-700 mb-4">
                <span className="font-semibold">Nota:</span> Los votos de Alcalde y Concejal se guardarán en una sola acta con tipo <span className="font-bold bg-orange-100 px-2 py-1 rounded">SUBNACIONAL</span>
              </p>

              {/* Alcalde */}
              <div className="mb-4 p-3 bg-white rounded border border-orange-200">
                <h3 className="font-semibold text-orange-700 mb-2">👤 Alcalde</h3>
                <div className="mb-2">
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Cargo *</label>
                  <select
                    value={actaMunicipal.id_cargo_alcalde}
                    onChange={(e) => setActaMunicipal(prev => ({ ...prev, id_cargo_alcalde: e.target.value }))}
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
                  <div className="mb-2">
                    <h4 className="font-bold text-gray-800 mb-2 text-xs">📋 Votos por Organización - ALCALDE</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {Object.entries(organizaciones).map(([nombre, id]) => (
                        <div key={id} className="flex flex-col bg-orange-50 p-2 rounded border border-orange-200 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-orange-700 text-xs">ALCALDE</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 text-xs">{nombre}</span>
                            <input
                              type="number"
                              min="0"
                              value={actaMunicipal.votosAlcalde[id] || 0}
                              onChange={(e) => handleVotoAlcaldeChange(id, e.target.value)}
                              className="w-16 p-1 border border-gray-300 rounded text-right font-semibold text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Blancos</label>
                    <input
                      type="number"
                      min="0"
                      value={actaMunicipal.votos_blancos_alcalde}
                      onChange={(e) => handleBlancosNulosAlcalde('votos_blancos_alcalde', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Nulos</label>
                    <input
                      type="number"
                      min="0"
                      value={actaMunicipal.votos_nulos_alcalde}
                      onChange={(e) => handleBlancosNulosAlcalde('votos_nulos_alcalde', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                    />
                  </div>
                </div>

                <div className="bg-orange-100 border border-orange-300 rounded p-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-bold">Total Alcalde:</span> {
                      Object.values(actaMunicipal.votosAlcalde).reduce((a,v) => a + (Number(v) || 0), 0) +
                      (Number(actaMunicipal.votos_blancos_alcalde) || 0) +
                      (Number(actaMunicipal.votos_nulos_alcalde) || 0)
                    }
                  </p>
                </div>
              </div>

              {/* Concejal */}
              <div className="p-3 bg-white rounded border border-green-200">
                <h3 className="font-semibold text-green-700 mb-2">🏘️ Concejal</h3>
                <div className="mb-2">
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Cargo *</label>
                  <select
                    value={actaMunicipal.id_cargo_concejal}
                    onChange={(e) => setActaMunicipal(prev => ({ ...prev, id_cargo_concejal: e.target.value }))}
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
                  <div className="mb-2">
                    <h4 className="font-bold text-gray-800 mb-2 text-xs">📋 Votos por Organización - CONCEJAL</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {Object.entries(organizaciones).map(([nombre, id]) => (
                        <div key={id} className="flex flex-col bg-green-50 p-2 rounded border border-green-200 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-green-700 text-xs">CONCEJAL</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 text-xs">{nombre}</span>
                            <input
                              type="number"
                              min="0"
                              value={actaMunicipal.votosConcejal[id] || 0}
                              onChange={(e) => handleVotoConcejalChange(id, e.target.value)}
                              className="w-16 p-1 border border-gray-300 rounded text-right font-semibold text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Blancos</label>
                    <input
                      type="number"
                      min="0"
                      value={actaMunicipal.votos_blancos_concejal}
                      onChange={(e) => handleBlancosNulosConcejal('votos_blancos_concejal', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Nulos</label>
                    <input
                      type="number"
                      min="0"
                      value={actaMunicipal.votos_nulos_concejal}
                      onChange={(e) => handleBlancosNulosConcejal('votos_nulos_concejal', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                    />
                  </div>
                </div>

                <div className="bg-green-100 border border-green-300 rounded p-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-bold">Total Concejal:</span> {
                      Object.values(actaMunicipal.votosConcejal).reduce((a,v) => a + (Number(v) || 0), 0) +
                      (Number(actaMunicipal.votos_blancos_concejal) || 0) +
                      (Number(actaMunicipal.votos_nulos_concejal) || 0)
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECCION GOBERNACION */}
          {(tipoEscrutinio === 'AMBOS' || tipoEscrutinio === 'SOLO_GOBERNACION') && (
            <div className="mb-6 border-2 border-green-400 rounded-lg p-4 bg-green-50">
              <h2 className="text-xl font-bold text-green-800 mb-4">🏛️ VOTACIÓN GOBERNACION</h2>
              <p className="text-sm text-green-700 mb-4">
                <span className="font-semibold">Nota:</span> Los votos de Gobernador y Asambleístas se guardarán en una sola acta con tipo <span className="font-bold bg-green-100 px-2 py-1 rounded">SUBNACIONAL</span>
              </p>

              {/* Gobernador */}
              <div className="mb-4 p-3 bg-white rounded border border-green-200">
                <h3 className="font-semibold text-green-700 mb-2">👤 Gobernador</h3>
                <div className="mb-2">
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Cargo *</label>
                  <select
                    value={actaGobernacion.id_cargo_gobernador}
                    onChange={(e) => setActaGobernacion(prev => ({ ...prev, id_cargo_gobernador: e.target.value }))}
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
                  <div className="mb-2">
                    <h4 className="font-bold text-gray-800 mb-2 text-xs">📋 Votos por Organización - GOBERNADOR</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {Object.entries(organizaciones).map(([nombre, id]) => (
                        <div key={id} className="flex flex-col bg-green-50 p-2 rounded border border-green-200 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-green-700 text-xs">GOBERNADOR</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 text-xs">{nombre}</span>
                            <input
                              type="number"
                              min="0"
                              value={actaGobernacion.votosGobernador[id] || 0}
                              onChange={(e) => handleVotoGobernadorChange(id, e.target.value)}
                              className="w-16 p-1 border border-gray-300 rounded text-right font-semibold text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Blancos</label>
                    <input
                      type="number"
                      min="0"
                      value={actaGobernacion.votos_blancos_gobernador}
                      onChange={(e) => handleBlancosNulosGobernador('votos_blancos_gobernador', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Nulos</label>
                    <input
                      type="number"
                      min="0"
                      value={actaGobernacion.votos_nulos_gobernador}
                      onChange={(e) => handleBlancosNulosGobernador('votos_nulos_gobernador', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                    />
                  </div>
                </div>

                <div className="bg-green-100 border border-green-300 rounded p-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-bold">Total Gobernador:</span> {
                      Object.values(actaGobernacion.votosGobernador).reduce((a,v) => a + (Number(v) || 0), 0) +
                      (Number(actaGobernacion.votos_blancos_gobernador) || 0) +
                      (Number(actaGobernacion.votos_nulos_gobernador) || 0)
                    }
                  </p>
                </div>
              </div>

              {/* Asambleísta Población */}
              <div className="mb-4 p-3 bg-white rounded border border-purple-200">
                <h3 className="font-semibold text-purple-700 mb-2">👥 Asambleísta por Población</h3>
                <div className="mb-2">
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Cargo *</label>
                  <select
                    value={actaGobernacion.id_cargo_asam_pob}
                    onChange={(e) => setActaGobernacion(prev => ({ ...prev, id_cargo_asam_pob: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Selecciona</option>
                    {Object.entries(cargos)
                      .filter(([nombre]) => {
                        const n = nombre.toLowerCase();
                        return (n.includes('asamble') || n.includes('asamblea')) && 
                               (n.includes('poblacion') || n.includes('población'));
                      })
                      .map(([nombre, id]) => (
                        <option key={id} value={id}>{nombre}</option>
                      ))}
                  </select>
                </div>

                {Object.keys(organizaciones).length > 0 && (
                  <div className="mb-2">
                    <h4 className="font-bold text-gray-800 mb-2 text-xs">📋 Votos por Organización - ASAMBLEÍSTA POR POBLACIÓN</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {Object.entries(organizaciones).map(([nombre, id]) => (
                        <div key={id} className="flex flex-col bg-purple-50 p-2 rounded border border-purple-200 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-purple-700 text-xs">ASAM. POBLACIÓN</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 text-xs">{nombre}</span>
                            <input
                              type="number"
                              min="0"
                              value={actaGobernacion.votosAsamPob[id] || 0}
                              onChange={(e) => handleVotoAsamPobChange(id, e.target.value)}
                              className="w-16 p-1 border border-gray-300 rounded text-right font-semibold text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Blancos</label>
                    <input
                      type="number"
                      min="0"
                      value={actaGobernacion.votos_blancos_asam_pob}
                      onChange={(e) => handleBlancosNulosAsamPob('votos_blancos_asam_pob', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Nulos</label>
                    <input
                      type="number"
                      min="0"
                      value={actaGobernacion.votos_nulos_asam_pob}
                      onChange={(e) => handleBlancosNulosAsamPob('votos_nulos_asam_pob', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                    />
                  </div>
                </div>

                <div className="bg-purple-100 border border-purple-300 rounded p-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-bold">Total Asam. Población:</span> {
                      Object.values(actaGobernacion.votosAsamPob).reduce((a,v) => a + (Number(v) || 0), 0) +
                      (Number(actaGobernacion.votos_blancos_asam_pob) || 0) +
                      (Number(actaGobernacion.votos_nulos_asam_pob) || 0)
                    }
                  </p>
                </div>
              </div>

              {/* Asambleísta Territorio */}
              <div className="p-3 bg-white rounded border border-blue-200">
                <h3 className="font-semibold text-blue-700 mb-2">🗺️ Asambleísta por Territorio</h3>
                <div className="mb-2">
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Cargo *</label>
                  <select
                    value={actaGobernacion.id_cargo_asam_terr}
                    onChange={(e) => setActaGobernacion(prev => ({ ...prev, id_cargo_asam_terr: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Selecciona</option>
                    {Object.entries(cargos)
                      .filter(([nombre]) => {
                        const n = nombre.toLowerCase();
                        return (n.includes('asamble') || n.includes('asamblea')) && 
                               (n.includes('territorio') || n.includes('territorial'));
                      })
                      .map(([nombre, id]) => (
                        <option key={id} value={id}>{nombre}</option>
                      ))}
                  </select>
                </div>

                {Object.keys(organizaciones).length > 0 && (
                  <div className="mb-2">
                    <h4 className="font-bold text-gray-800 mb-2 text-xs">📋 Votos por Organización - ASAMBLEÍSTA POR TERRITORIO</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {Object.entries(organizaciones).map(([nombre, id]) => (
                        <div key={id} className="flex flex-col bg-blue-50 p-2 rounded border border-blue-200 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-blue-700 text-xs">ASAM. TERRITORIO</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 text-xs">{nombre}</span>
                            <input
                              type="number"
                              min="0"
                              value={actaGobernacion.votosAsamTerr[id] || 0}
                              onChange={(e) => handleVotoAsamTerrChange(id, e.target.value)}
                              className="w-16 p-1 border border-gray-300 rounded text-right font-semibold text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Blancos</label>
                    <input
                      type="number"
                      min="0"
                      value={actaGobernacion.votos_blancos_asam_terr}
                      onChange={(e) => handleBlancosNulosAsamTerr('votos_blancos_asam_terr', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Nulos</label>
                    <input
                      type="number"
                      min="0"
                      value={actaGobernacion.votos_nulos_asam_terr}
                      onChange={(e) => handleBlancosNulosAsamTerr('votos_nulos_asam_terr', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-center font-semibold"
                    />
                  </div>
                </div>

                <div className="bg-blue-100 border border-blue-300 rounded p-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-bold">Total Asam. Territorio:</span> {
                      Object.values(actaGobernacion.votosAsamTerr).reduce((a,v) => a + (Number(v) || 0), 0) +
                      (Number(actaGobernacion.votos_blancos_asam_terr) || 0) +
                      (Number(actaGobernacion.votos_nulos_asam_terr) || 0)
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subida de archivos */}
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
              {loading ? 'Guardando...' : '💾 Guardar Acta General'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente SelectField
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
