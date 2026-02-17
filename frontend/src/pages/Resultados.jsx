// frontend/src/pages/Resultados.jsx
import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Resultados() {
  const navigate = useNavigate();

  // Estados para filtros
  const [departamentos, setDepartamentos] = useState({});
  const [provincias, setProvincias] = useState({});
  const [municipios, setMunicipios] = useState({});
  const [recintos, setRecintos] = useState({});

  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [selectedProvincia, setSelectedProvincia] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [selectedRecinto, setSelectedRecinto] = useState('');

  // Estados para datos
  const [resultados, setResultados] = useState([]);
  const [resumen, setResumen] = useState({
    // Totales generales
    total_inscritos: 0,

    // Gobernador
    gobernador: {
      total_actas: 0,
      total_votos: 0,
      votos_blancos: 0,
      votos_nulos: 0,
      total_inscritos: 0,
      total_inscritos_departamento: 0,
      total_inscritos_provincia: 0,
      total_inscritos_municipio: 0,
      total_inscritos_recinto: 0,
      votos_libre: 0,
      votos_creemos: 0,
      votos_cc: 0
    },

    // Asambleístas por Territorio
    asambleistas_territorio: {
      total_actas: 0,
      total_votos: 0,
      votos_blancos: 0,
      votos_nulos: 0,
      total_inscritos: 0,
      total_inscritos_departamento: 0,
      total_inscritos_provincia: 0,
      total_inscritos_municipio: 0,
      total_inscritos_recinto: 0,
      votos_libre: 0,
      votos_creemos: 0,
      votos_cc: 0
    },

    // Asambleístas por Población
    asambleistas_poblacion: {
      total_actas: 0,
      total_votos: 0,
      votos_blancos: 0,
      votos_nulos: 0,
      total_inscritos: 0,
      total_inscritos_departamento: 0,
      total_inscritos_provincia: 0,
      total_inscritos_municipio: 0,
      total_inscritos_recinto: 0,
      votos_libre: 0,
      votos_creemos: 0,
      votos_cc: 0
    },

    // Alcalde
    alcalde: {
      total_actas: 0,
      total_votos: 0,
      votos_blancos: 0,
      votos_nulos: 0,
      total_inscritos: 0,
      total_inscritos_departamento: 0,
      total_inscritos_provincia: 0,
      total_inscritos_municipio: 0,
      total_inscritos_recinto: 0,
      votos_libre: 0,
      votos_creemos: 0,
      votos_cc: 0
    },

    // Concejal
    concejal: {
      total_actas: 0,
      total_votos: 0,
      votos_blancos: 0,
      votos_nulos: 0,
      total_inscritos: 0,
      total_inscritos_departamento: 0,
      total_inscritos_provincia: 0,
      total_inscritos_municipio: 0,
      total_inscritos_recinto: 0,
      votos_libre: 0,
      votos_creemos: 0,
      votos_cc: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tipoGrafico, setTipoGrafico] = useState('torta'); // 'torta' o 'barras'

  // Cargar departamentos al iniciar
  useEffect(() => {
    const cargarGeografia = async () => {
      try {
        console.log('Cargando departamentos...');
        const res = await api.get('/api/catalog?table=departamentos');
        console.log('Respuesta de departamentos:', res.data);

        // El catalog devuelve {nombre: id}, igual que las funciones de geografia
        const deptData = res.data || {};
        console.log('Datos originales de departamentos:', deptData);
        
        setDepartamentos(deptData);
        // Limpiar resultados al inicio
        setResultados([]);
        setResumen({
          total_inscritos: 0,

          // Gobernador
          gobernador: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Asambleístas por Territorio
          asambleistas_territorio: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Asambleístas por Población
          asambleistas_poblacion: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Alcalde
          alcalde: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Concejal
          concejal: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          }
        });
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar departamentos', err);
        console.error('Error details:', err.response || err.message || err);
        setError('❌ Error al cargar datos geográficos');
        setLoading(false);
      }
    };
    cargarGeografia();
  }, []);

  // Cargar provincias cuando cambia departamento
  useEffect(() => {
    // Verificar que selectedDepartamento sea un valor válido (número positivo)
    // Convertir a número y validar
    const deptId = Number(selectedDepartamento);
    
    // Si no hay departamento seleccionado, limpiar provincias
    if (!selectedDepartamento || selectedDepartamento === "") {
      setProvincias({});
      setSelectedProvincia('');
      return;
    }
    
    // Si el ID no es válido, también limpiar
    if (isNaN(deptId) || deptId <= 0) {
      console.warn(`ID de departamento inválido: ${selectedDepartamento}`);
      setProvincias({});
      setSelectedProvincia('');
      return;
    }

    const cargarProvincias = async () => {
      try {
        console.log(`Cargando provincias para departamento ID: ${deptId}`);
        const res = await api.get(`/api/provincias/departamento/${deptId}`);
        console.log('Respuesta de provincias:', res.data);

        // Directamente usar los datos recibidos ya que db.py devuelve {nombre: id}
        const provData = res.data || {};
        console.log('Datos originales de provincias:', provData);
        console.log('Entries de datos originales de provincias:', Object.entries(provData));

        // Validar que los datos estén en el formato correcto antes de guardarlos
        const validatedProvData = {};
        for (const [nombre, id] of Object.entries(provData)) {
          const parsedId = parseInt(id, 10);
          if (!isNaN(parsedId) && nombre && typeof nombre === 'string') {
            validatedProvData[nombre] = parsedId;
          }
        }
        console.log('Provincias validadas:', validatedProvData);
        setProvincias(validatedProvData);

        // Resetear selecciones dependientes y resultados
        setSelectedProvincia('');
        setSelectedMunicipio('');
        setSelectedRecinto('');
        setResultados([]);
        setResumen({
          total_inscritos: 0,

          // Gobernador
          gobernador: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Asambleístas por Territorio
          asambleistas_territorio: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Asambleístas por Población
          asambleistas_poblacion: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Alcalde
          alcalde: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Concejal
          concejal: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          }
        });
      } catch (err) {
        console.error('Error al cargar provincias', err);
        console.error('Error details:', err.response || err.message || err);
        setProvincias({});
        // También resetear selecciones dependientes en caso de error
        setSelectedProvincia('');
        setSelectedMunicipio('');
        setSelectedRecinto('');
      }
    };
    cargarProvincias();
  }, [selectedDepartamento]);

  // Cargar municipios cuando cambia provincia
  useEffect(() => {
    // Verificar que selectedProvincia sea un valor válido
    const provId = Number(selectedProvincia);
    
    // Si no hay provincia seleccionada, limpiar municipios
    if (!selectedProvincia || selectedProvincia === "") {
      setMunicipios({});
      setSelectedMunicipio('');
      return;
    }
    
    // Si el ID no es válido, también limpiar
    if (isNaN(provId) || provId <= 0) {
      console.warn(`ID de provincia inválido: ${selectedProvincia}`);
      setMunicipios({});
      setSelectedMunicipio('');
      return;
    }

    const cargarMunicipios = async () => {
      try {
        console.log(`Cargando municipios para provincia ID: ${provId}`);
        const res = await api.get(`/api/municipios/provincia/${provId}`);
        console.log('Respuesta de municipios:', res.data);

        // Directamente usar los datos recibidos ya que db.py devuelve {nombre: id}
        const muniData = res.data || {};
        console.log('Datos originales de municipios:', muniData);
        console.log('Entries de datos originales de municipios:', Object.entries(muniData));

        // Validar que los datos estén en el formato correcto antes de guardarlos
        const validatedMuniData = {};
        for (const [nombre, id] of Object.entries(muniData)) {
          const parsedId = parseInt(id, 10);
          if (!isNaN(parsedId) && nombre && typeof nombre === 'string') {
            validatedMuniData[nombre] = parsedId;
          }
        }
        setMunicipios(validatedMuniData);
        // Resetear selecciones dependientes y resultados
        setSelectedMunicipio('');
        setSelectedRecinto('');
        setResultados([]);
        setResumen({
          total_inscritos: 0,

          // Gobernador
          gobernador: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Asambleístas por Territorio
          asambleistas_territorio: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Asambleístas por Población
          asambleistas_poblacion: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Alcalde
          alcalde: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Concejal
          concejal: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          }
        });
      } catch (err) {
        console.error('Error al cargar municipios', err);
        console.error('Error details:', err.response || err.message || err);
        setMunicipios({});
        // También resetear selecciones dependientes en caso de error
        setSelectedMunicipio('');
        setSelectedRecinto('');
      }
    };
    cargarMunicipios();
  }, [selectedProvincia]);

  // Cargar recintos cuando cambia municipio
  useEffect(() => {
    // Verificar que selectedMunicipio sea un valor válido
    const muniId = Number(selectedMunicipio);
    
    // Si no hay municipio seleccionado, limpiar recintos
    if (!selectedMunicipio || selectedMunicipio === "") {
      setRecintos({});
      setSelectedRecinto('');
      return;
    }
    
    // Si el ID no es válido, también limpiar
    if (isNaN(muniId) || muniId <= 0) {
      console.warn(`ID de municipio inválido: ${selectedMunicipio}`);
      setRecintos({});
      setSelectedRecinto('');
      return;
    }

    const cargarRecintos = async () => {
      try {
        console.log(`Cargando recintos para municipio ID: ${muniId}`);
        const res = await api.get(`/api/recintos/municipio/${muniId}`);
        console.log('Respuesta de recintos:', res.data);

        // Directamente usar los datos recibidos ya que db.py devuelve {nombre: id}
        const reciData = res.data || {};
        console.log('Datos originales de recintos:', reciData);
        console.log('Entries de datos originales de recintos:', Object.entries(reciData));

        // Validar que los datos estén en el formato correcto antes de guardarlos
        const validatedReciData = {};
        for (const [nombre, id] of Object.entries(reciData)) {
          const parsedId = parseInt(id, 10);
          if (!isNaN(parsedId) && nombre && typeof nombre === 'string') {
            validatedReciData[nombre] = parsedId;
          }
        }
        setRecintos(validatedReciData);
        // Resetear selección de recinto y resultados
        setSelectedRecinto('');
        setResultados([]);
        setResumen({
          total_inscritos: 0,

          // Gobernador
          gobernador: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Asambleístas por Territorio
          asambleistas_territorio: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Asambleístas por Población
          asambleistas_poblacion: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Alcalde
          alcalde: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          },

          // Concejal
          concejal: {
            total_actas: 0,
            total_votos: 0,
            votos_blancos: 0,
            votos_nulos: 0,
            total_inscritos: 0,
            total_inscritos_departamento: 0,
            total_inscritos_provincia: 0,
            total_inscritos_municipio: 0,
            total_inscritos_recinto: 0,
            votos_libre: 0,
            votos_creemos: 0,
            votos_cc: 0
          }
        });
      } catch (err) {
        console.error('Error al cargar recintos', err);
        console.error('Error details:', err.response || err.message || err);
        setRecintos({});
        // También resetear selección de recinto en caso de error
        setSelectedRecinto('');
      }
    };
    cargarRecintos();
  }, [selectedMunicipio]);

  // Cargar resultados con los filtros seleccionados
  const cargarResultados = async () => {
    try {
      setLoading(true);
      let url = '/api/dashboard/resultados-completos';

      // Construir URL con los filtros aplicados
      const params = new URLSearchParams();

      // Convertir a número si es posible y es un valor válido para asegurar consistencia con el backend
      const deptNum = Number(selectedDepartamento);
      const provNum = Number(selectedProvincia);
      const muniNum = Number(selectedMunicipio);
      const reciNum = Number(selectedRecinto);

      if (!isNaN(reciNum) && reciNum > 0) params.append('recinto', reciNum);
      else if (!isNaN(muniNum) && muniNum > 0) params.append('municipio', muniNum);
      else if (!isNaN(provNum) && provNum > 0) params.append('provincia', provNum);
      else if (!isNaN(deptNum) && deptNum > 0) params.append('departamento', deptNum);

      if (params.toString()) {
        url += '?' + params.toString();
      }

      console.log('URL de resultados:', url);
      const res = await api.get(url);
      const data = res.data || {};

      // Extraer resultados por categoría electoral
      const gobernadorData = data.gobernador || {};
      const asambleistasTerritorioData = data.asambleistas_territorio || {};
      const asambleistasPoblacionData = data.asambleistas_poblacion || {};
      const alcaldeData = data.alcalde || {};
      const concejalData = data.concejal || {};

      // Establecer candidatos principales (usaremos los de gobernador como referencia)
      setResultados(gobernadorData.candidatos || []);

      // Actualizar el resumen con los datos específicos por categoría
      setResumen({
        total_inscritos: gobernadorData.resumen?.total_inscritos || 0,
        gobernador: {
          total_actas: gobernadorData.resumen?.total_actas || 0,
          total_votos: gobernadorData.resumen?.total_votos || 0,
          votos_blancos: gobernadorData.resumen?.votos_blancos || 0,
          votos_nulos: gobernadorData.resumen?.votos_nulos || 0,
          total_inscritos: gobernadorData.resumen?.total_inscritos || 0,
          total_inscritos_departamento: gobernadorData.resumen?.total_inscritos_departamento || 0,
          total_inscritos_provincia: gobernadorData.resumen?.total_inscritos_provincia || 0,
          total_inscritos_municipio: gobernadorData.resumen?.total_inscritos_municipio || 0,
          total_inscritos_recinto: gobernadorData.resumen?.total_inscritos_recinto || 0,
          votos_libre: gobernadorData.resumen?.votos_libre || 0,
          votos_creemos: gobernadorData.resumen?.votos_creemos || 0,
          votos_cc: gobernadorData.resumen?.votos_cc || 0
        },
        asambleistas_territorio: {
          total_actas: asambleistasTerritorioData.resumen?.total_actas || 0,
          total_votos: asambleistasTerritorioData.resumen?.total_votos || 0,
          votos_blancos: asambleistasTerritorioData.resumen?.votos_blancos || 0,
          votos_nulos: asambleistasTerritorioData.resumen?.votos_nulos || 0,
          total_inscritos: asambleistasTerritorioData.resumen?.total_inscritos || 0,
          total_inscritos_departamento: asambleistasTerritorioData.resumen?.total_inscritos_departamento || 0,
          total_inscritos_provincia: asambleistasTerritorioData.resumen?.total_inscritos_provincia || 0,
          total_inscritos_municipio: asambleistasTerritorioData.resumen?.total_inscritos_municipio || 0,
          total_inscritos_recinto: asambleistasTerritorioData.resumen?.total_inscritos_recinto || 0,
          votos_libre: asambleistasTerritorioData.resumen?.votos_libre || 0,
          votos_creemos: asambleistasTerritorioData.resumen?.votos_creemos || 0,
          votos_cc: asambleistasTerritorioData.resumen?.votos_cc || 0
        },
        asambleistas_poblacion: {
          total_actas: asambleistasPoblacionData.resumen?.total_actas || 0,
          total_votos: asambleistasPoblacionData.resumen?.total_votos || 0,
          votos_blancos: asambleistasPoblacionData.resumen?.votos_blancos || 0,
          votos_nulos: asambleistasPoblacionData.resumen?.votos_nulos || 0,
          total_inscritos: asambleistasPoblacionData.resumen?.total_inscritos || 0,
          total_inscritos_departamento: asambleistasPoblacionData.resumen?.total_inscritos_departamento || 0,
          total_inscritos_provincia: asambleistasPoblacionData.resumen?.total_inscritos_provincia || 0,
          total_inscritos_municipio: asambleistasPoblacionData.resumen?.total_inscritos_municipio || 0,
          total_inscritos_recinto: asambleistasPoblacionData.resumen?.total_inscritos_recinto || 0,
          votos_libre: asambleistasPoblacionData.resumen?.votos_libre || 0,
          votos_creemos: asambleistasPoblacionData.resumen?.votos_creemos || 0,
          votos_cc: asambleistasPoblacionData.resumen?.votos_cc || 0
        },
        alcalde: {
          total_actas: alcaldeData.resumen?.total_actas || 0,
          total_votos: alcaldeData.resumen?.total_votos || 0,
          votos_blancos: alcaldeData.resumen?.votos_blancos || 0,
          votos_nulos: alcaldeData.resumen?.votos_nulos || 0,
          total_inscritos: alcaldeData.resumen?.total_inscritos || 0,
          total_inscritos_departamento: alcaldeData.resumen?.total_inscritos_departamento || 0,
          total_inscritos_provincia: alcaldeData.resumen?.total_inscritos_provincia || 0,
          total_inscritos_municipio: alcaldeData.resumen?.total_inscritos_municipio || 0,
          total_inscritos_recinto: alcaldeData.resumen?.total_inscritos_recinto || 0,
          votos_libre: alcaldeData.resumen?.votos_libre || 0,
          votos_creemos: alcaldeData.resumen?.votos_creemos || 0,
          votos_cc: alcaldeData.resumen?.votos_cc || 0
        },
        concejal: {
          total_actas: concejalData.resumen?.total_actas || 0,
          total_votos: concejalData.resumen?.total_votos || 0,
          votos_blancos: concejalData.resumen?.votos_blancos || 0,
          votos_nulos: concejalData.resumen?.votos_nulos || 0,
          total_inscritos: concejalData.resumen?.total_inscritos || 0,
          total_inscritos_departamento: concejalData.resumen?.total_inscritos_departamento || 0,
          total_inscritos_provincia: concejalData.resumen?.total_inscritos_provincia || 0,
          total_inscritos_municipio: concejalData.resumen?.total_inscritos_municipio || 0,
          total_inscritos_recinto: concejalData.resumen?.total_inscritos_recinto || 0,
          votos_libre: concejalData.resumen?.votos_libre || 0,
          votos_creemos: concejalData.resumen?.votos_creemos || 0,
          votos_cc: concejalData.resumen?.votos_cc || 0
        }
      });

      setError('');
    } catch (err) {
      console.error('Error al cargar resultados', err);
      setError('❌ Error al cargar los resultados');
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar resultados cuando cambia algún filtro geográfico
  useEffect(() => {
    // Solo cargar resultados si hay un filtro seleccionado
    // Usamos un pequeño delay para asegurar que los estados se han actualizado completamente
    // y evitar cargar resultados con estados intermedios durante el proceso de cascada
    const timer = setTimeout(() => {
      // Verificar que el estado seleccionado sea coherente con la jerarquía geográfica
      // Por ejemplo, si hay un municipio seleccionado, debería haber también provincia y departamento
      if (selectedRecinto) {
        // Si hay recinto, cargar resultados para ese recinto
        cargarResultados();
      } else if (selectedMunicipio) {
        // Si hay municipio pero no recinto, cargar resultados para ese municipio
        cargarResultados();
      } else if (selectedProvincia) {
        // Si hay provincia pero no municipio ni recinto, cargar resultados para esa provincia
        cargarResultados();
      } else if (selectedDepartamento) {
        // Si solo hay departamento, cargar resultados para ese departamento
        cargarResultados();
      }
    }, 100); // Aumentamos el delay para asegurar la sincronización

    return () => clearTimeout(timer);
  }, [selectedDepartamento, selectedProvincia, selectedMunicipio, selectedRecinto]);

  // Preparar datos para gráficos
  const porcentaje = (valor, total) => total > 0 ? ((valor / total) * 100).toFixed(1) : 0;

  // Función para generar datos para gráficos
  const generarDatosGrafico = (titulo) => {
    const labels = resultados.map(r => r.nombre || r.candidato);
    const dataValues = resultados.map(r => r.votos || 0);

    const backgroundColors = [
      '#FE0000', // LIBRE (Rojo)
      '#FFD700', // CREEMOS (Oro)
      '#FF4500', // CC (Naranja rojo)
      '#4CAF50', // Verde
      '#2196F3', // Azul
      '#9C27B0', // Púrpura
      '#FF9800', // Naranja
      '#795548', // Marrón
      '#E91E63', // Rosa
      '#3F51B5'  // Azul índigo
    ];

    return {
      labels,
      datasets: [{
        label: titulo,
        data: dataValues,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  // Función para generar datos para gráficos por categoría electoral (votos blancos, nulos, libre)
  const generarDatosGraficoCategoria = (categoria, datos) => {
    // Calcular el total de votos para porcentajes
    const totalVotos = datos.total_votos || 0;
    
    // Calcular Otros como total_votos - votos_libre - votos_blancos - votos_nulos
    const otrosVotos = Math.max(0, (datos.total_votos || 0) - (datos.votos_libre || 0) - (datos.votos_blancos || 0) - (datos.votos_nulos || 0));
    
    // Crear etiquetas y valores para votos blancos, nulos, libre y otros
    const labels = [
      `Blancos (${datos.votos_blancos || 0}) ${(totalVotos > 0 ? ((datos.votos_blancos || 0) / totalVotos * 100).toFixed(1) : 0)}%`,
      `Nulos (${datos.votos_nulos || 0}) ${(totalVotos > 0 ? ((datos.votos_nulos || 0) / totalVotos * 100).toFixed(1) : 0)}%`,
      `LIBRE (${datos.votos_libre || 0}) ${(totalVotos > 0 ? ((datos.votos_libre || 0) / totalVotos * 100).toFixed(1) : 0)}%`,
      `Otros (${otrosVotos}) ${(totalVotos > 0 ? ((otrosVotos) / totalVotos * 100).toFixed(1) : 0)}%`
    ];
    
    const dataValues = [
      datos.votos_blancos || 0,
      datos.votos_nulos || 0,
      datos.votos_libre || 0,
      otrosVotos
    ];

    // Colores específicos para cada tipo de voto
    const backgroundColors = [
      '#6B7280', // Gris para votos blancos
      '#EF4444', // Rojo para votos nulos
      '#FE0000', // Rojo oscuro para LIBRE
      '#3B82F6'  // Azul para Otros
    ];

    return {
      labels,
      datasets: [{
        label: `Votos - ${categoria}`,
        data: dataValues,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'right' },
      title: {
        display: true,
        text: 'Resultados Electorales',
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Ranking de Candidatos', font: { size: 16 } },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: { beginAtZero: true }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Resultados Electorales</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          ← Volver al Dashboard
        </button>
      </div>

      {/* Filtros geográficos */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">🗺️ Filtros Geográficos</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Departamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
            <select
              value={selectedDepartamento}
              onChange={(e) => {
                const value = e.target.value;
                // Solo establecer el valor si es un número válido o una cadena vacía para "Seleccionar"
                if (value === "" || !isNaN(Number(value)) && Number(value) > 0) {
                  setSelectedDepartamento(value);
                } else {
                  setSelectedDepartamento("");
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Seleccionar --</option>
              {Object.entries(departamentos).map(([nombre, id]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </select>
          </div>

          {/* Provincia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
            <select
              value={selectedProvincia}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || !isNaN(Number(value)) && Number(value) > 0) {
                  setSelectedProvincia(value);
                } else {
                  setSelectedProvincia("");
                }
              }}
              disabled={!selectedDepartamento}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">-- Seleccionar --</option>
              {Object.entries(provincias).map(([nombre, id]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </select>
          </div>

          {/* Municipio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Municipio</label>
            <select
              value={selectedMunicipio}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || !isNaN(Number(value)) && Number(value) > 0) {
                  setSelectedMunicipio(value);
                } else {
                  setSelectedMunicipio("");
                }
              }}
              disabled={!selectedProvincia}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">-- Seleccionar --</option>
              {Object.entries(municipios).map(([nombre, id]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </select>
          </div>

          {/* Recinto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recinto</label>
            <select
              value={selectedRecinto}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || !isNaN(Number(value)) && Number(value) > 0) {
                  setSelectedRecinto(value);
                } else {
                  setSelectedRecinto("");
                }
              }}
              disabled={!selectedMunicipio}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">-- Seleccionar --</option>
              {Object.entries(recintos).map(([nombre, id]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Cargando resultados...</p>
        </div>
      ) : (
        <>
          {/* Resumen general */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">📈 Resumen General</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-xs text-gray-600">Total Inscritos por Departamento</p>
                <p className="text-2xl font-bold text-blue-700">{resumen.gobernador.total_inscritos_departamento || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-xs text-gray-600">Total Inscritos por Provincia</p>
                <p className="text-2xl font-bold text-purple-700">{resumen.gobernador.total_inscritos_provincia || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-xs text-gray-600">Total Inscritos por Municipio</p>
                <p className="text-2xl font-bold text-green-700">{resumen.gobernador.total_inscritos_municipio || 0}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-xs text-gray-600">Total Inscritos por Recinto</p>
                <p className="text-2xl font-bold text-yellow-700">{resumen.gobernador.total_inscritos_recinto || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-xs text-gray-600">Total General</p>
                <p className="text-2xl font-bold text-red-700">{resumen.total_inscritos || 0}</p>
              </div>
            </div>
          </div>

          {/* Resumen por categoría electoral */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">📊 Resultados por Categoría Electoral</h2>
            
            {/* Gobernador */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-3 text-blue-700">Gobernador</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Actas</p>
                  <p className="font-bold text-blue-700">{resumen.gobernador.total_actas || 0}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Votos</p>
                  <p className="font-bold text-green-700">{resumen.gobernador.total_votos || 0}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Blancos</p>
                  <p className="font-bold text-purple-700">{resumen.gobernador.votos_blancos || 0}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Nulos</p>
                  <p className="font-bold text-red-700">{resumen.gobernador.votos_nulos || 0}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">LIBRE</p>
                  <p className="font-bold text-yellow-700">{resumen.gobernador.votos_libre || 0}</p>
                </div>
              </div>
            </div>

            {/* Asambleístas por Territorio */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-3 text-green-700">Asambleístas por Territorio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Actas</p>
                  <p className="font-bold text-blue-700">{resumen.asambleistas_territorio.total_actas || 0}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Votos</p>
                  <p className="font-bold text-green-700">{resumen.asambleistas_territorio.total_votos || 0}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Blancos</p>
                  <p className="font-bold text-purple-700">{resumen.asambleistas_territorio.votos_blancos || 0}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Nulos</p>
                  <p className="font-bold text-red-700">{resumen.asambleistas_territorio.votos_nulos || 0}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">LIBRE</p>
                  <p className="font-bold text-yellow-700">{resumen.asambleistas_territorio.votos_libre || 0}</p>
                </div>
              </div>
            </div>

            {/* Asambleístas por Población */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-3 text-purple-700">Asambleístas por Población</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Actas</p>
                  <p className="font-bold text-blue-700">{resumen.asambleistas_poblacion.total_actas || 0}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Votos</p>
                  <p className="font-bold text-green-700">{resumen.asambleistas_poblacion.total_votos || 0}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Blancos</p>
                  <p className="font-bold text-purple-700">{resumen.asambleistas_poblacion.votos_blancos || 0}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Nulos</p>
                  <p className="font-bold text-red-700">{resumen.asambleistas_poblacion.votos_nulos || 0}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">LIBRE</p>
                  <p className="font-bold text-yellow-700">{resumen.asambleistas_poblacion.votos_libre || 0}</p>
                </div>
              </div>
            </div>

            {/* Alcalde */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-3 text-red-700">Alcalde</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Actas</p>
                  <p className="font-bold text-blue-700">{resumen.alcalde.total_actas || 0}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Votos</p>
                  <p className="font-bold text-green-700">{resumen.alcalde.total_votos || 0}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Blancos</p>
                  <p className="font-bold text-purple-700">{resumen.alcalde.votos_blancos || 0}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Nulos</p>
                  <p className="font-bold text-red-700">{resumen.alcalde.votos_nulos || 0}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">LIBRE</p>
                  <p className="font-bold text-yellow-700">{resumen.alcalde.votos_libre || 0}</p>
                </div>
              </div>
            </div>

            {/* Concejal */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-3 text-yellow-700">Concejal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Actas</p>
                  <p className="font-bold text-blue-700">{resumen.concejal.total_actas || 0}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Votos</p>
                  <p className="font-bold text-green-700">{resumen.concejal.total_votos || 0}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Blancos</p>
                  <p className="font-bold text-purple-700">{resumen.concejal.votos_blancos || 0}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Nulos</p>
                  <p className="font-bold text-red-700">{resumen.concejal.votos_nulos || 0}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">LIBRE</p>
                  <p className="font-bold text-yellow-700">{resumen.concejal.votos_libre || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visualización de resultados por categoría electoral */}
          {resultados.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">📊 Visualización de Resultados por Categoría Electoral</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTipoGrafico('torta')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      tipoGrafico === 'torta'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    🥧 Torta
                  </button>
                  <button
                    onClick={() => setTipoGrafico('barras')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      tipoGrafico === 'barras'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    📊 Barras
                  </button>
                </div>
              </div>

              {/* Gráficos por categoría electoral */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Gobernador */}
                <div className="h-80">
                  <h3 className="text-md font-semibold mb-2 text-center text-blue-700">Gobernador</h3>
                  {tipoGrafico === 'torta' ? (
                    <Pie data={generarDatosGraficoCategoria('Gobernador', resumen.gobernador)} options={chartOptions} />
                  ) : (
                    <Bar data={generarDatosGraficoCategoria('Gobernador', resumen.gobernador)} options={barOptions} />
                  )}
                </div>

                {/* Asambleista por Territorio */}
                <div className="h-80">
                  <h3 className="text-md font-semibold mb-2 text-center text-green-700">Asambleista Territorio</h3>
                  {tipoGrafico === 'torta' ? (
                    <Pie data={generarDatosGraficoCategoria('Asambleista Territorio', resumen.asambleistas_territorio)} options={chartOptions} />
                  ) : (
                    <Bar data={generarDatosGraficoCategoria('Asambleista Territorio', resumen.asambleistas_territorio)} options={barOptions} />
                  )}
                </div>

                {/* Asambleista por Población */}
                <div className="h-80">
                  <h3 className="text-md font-semibold mb-2 text-center text-purple-700">Asambleista Población</h3>
                  {tipoGrafico === 'torta' ? (
                    <Pie data={generarDatosGraficoCategoria('Asambleista Población', resumen.asambleistas_poblacion)} options={chartOptions} />
                  ) : (
                    <Bar data={generarDatosGraficoCategoria('Asambleista Población', resumen.asambleistas_poblacion)} options={barOptions} />
                  )}
                </div>

                {/* Alcalde */}
                <div className="h-80">
                  <h3 className="text-md font-semibold mb-2 text-center text-red-700">Alcalde</h3>
                  {tipoGrafico === 'torta' ? (
                    <Pie data={generarDatosGraficoCategoria('Alcalde', resumen.alcalde)} options={chartOptions} />
                  ) : (
                    <Bar data={generarDatosGraficoCategoria('Alcalde', resumen.alcalde)} options={barOptions} />
                  )}
                </div>

                {/* Concejal */}
                <div className="h-80">
                  <h3 className="text-md font-semibold mb-2 text-center text-yellow-700">Concejal</h3>
                  {tipoGrafico === 'torta' ? (
                    <Pie data={generarDatosGraficoCategoria('Concejal', resumen.concejal)} options={chartOptions} />
                  ) : (
                    <Bar data={generarDatosGraficoCategoria('Concejal', resumen.concejal)} options={barOptions} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabla de resultados por categoría electoral */}
          {resultados.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">📋 Resultados por Organización Política y Categoría Electoral</h2>
              
              {/* Gobernador */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3 text-blue-700">Gobernador</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organización</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Votos</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Barra</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LIBRE</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{resumen.gobernador.votos_libre || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {porcentaje(resumen.gobernador.votos_libre, resumen.gobernador.total_votos)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="h-2.5 rounded-full bg-blue-600"
                              style={{ width: `${porcentaje(resumen.gobernador.votos_libre, resumen.gobernador.total_votos)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Asambleista por Territorio */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3 text-green-700">Asambleista por Territorio</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organización</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Votos</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Barra</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LIBRE</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{resumen.asambleistas_territorio.votos_libre || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {porcentaje(resumen.asambleistas_territorio.votos_libre, resumen.asambleistas_territorio.total_votos)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="h-2.5 rounded-full bg-green-600"
                              style={{ width: `${porcentaje(resumen.asambleistas_territorio.votos_libre, resumen.asambleistas_territorio.total_votos)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Asambleista por Población */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3 text-purple-700">Asambleista por Población</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organización</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Votos</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Barra</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LIBRE</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{resumen.asambleistas_poblacion.votos_libre || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {porcentaje(resumen.asambleistas_poblacion.votos_libre, resumen.asambleistas_poblacion.total_votos)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="h-2.5 rounded-full bg-purple-600"
                              style={{ width: `${porcentaje(resumen.asambleistas_poblacion.votos_libre, resumen.asambleistas_poblacion.total_votos)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Alcalde */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3 text-red-700">Alcalde</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organización</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Votos</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Barra</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LIBRE</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{resumen.alcalde.votos_libre || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {porcentaje(resumen.alcalde.votos_libre, resumen.alcalde.total_votos)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="h-2.5 rounded-full bg-red-600"
                              style={{ width: `${porcentaje(resumen.alcalde.votos_libre, resumen.alcalde.total_votos)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Concejal */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3 text-yellow-700">Concejal</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organización</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Votos</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Barra</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LIBRE</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{resumen.concejal.votos_libre || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {porcentaje(resumen.concejal.votos_libre, resumen.concejal.total_votos)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="h-2.5 rounded-full bg-yellow-600"
                              style={{ width: `${porcentaje(resumen.concejal.votos_libre, resumen.concejal.total_votos)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {resultados.length === 0 && !loading && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-8 rounded-lg text-center">
              <p>No hay resultados disponibles. Seleccione un área geográfica para ver los datos.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}