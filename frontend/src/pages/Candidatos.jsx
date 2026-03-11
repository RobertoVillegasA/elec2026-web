// frontend/src/pages/Candidatos.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Candidatos() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    orden: '',
    posicion: '',
    id_organizacion: '',
    id_cargo: '',
    id_departamento: '',
    id_provincia: '',
    id_municipio: '',
    nombres: '',
    apellidos: '',
    genero: 'M',
    edad: '',
    tipo_candidatura: 'TITULAR'
  });
  const [catalogs, setCatalogs] = useState({
    organizaciones: {},
    cargos: {},
    departamentos: {},
    provincias: {},
    municipios: {}
  });

  // Cargar catálogos iniciales
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [orgRes, cargoRes, deptoRes] = await Promise.all([
          api.get('/catalog?table=organizaciones_politicas'),
          api.get('/catalog?table=cargos'),
          api.get('/catalog?table=departamentos')
        ]);
        setCatalogs({
          organizaciones: orgRes.data || {},
          cargos: cargoRes.data || {},
          departamentos: deptoRes.data || {},
          provincias: {},
          municipios: {}
        });
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
        alert('❌ Error al cargar datos iniciales');
      }
    };
    loadCatalogs();
  }, []);

  const handleDeptoChange = async (idDepto) => {
    setFormData(prev => ({ ...prev, id_departamento: idDepto, id_provincia: '', id_municipio: '' }));
    setCatalogs(prev => ({ ...prev, provincias: {}, municipios: {} }));
    if (!idDepto) return;
    try {
      const res = await api.get(`/provincias/departamento/${idDepto}`);
      setCatalogs(prev => ({ ...prev, provincias: res.data || {} }));
    } catch (err) {
      console.error('Error al cargar provincias:', err);
      alert('❌ Error al cargar provincias');
    }
  };

  const handleProvChange = async (idProv) => {
    setFormData(prev => ({ ...prev, id_provincia: idProv, id_municipio: '' }));
    setCatalogs(prev => ({ ...prev, municipios: {} }));
    if (!idProv) return;
    try {
      const res = await api.get(`/municipios/provincia/${idProv}`);
      setCatalogs(prev => ({ ...prev, municipios: res.data || {} }));
    } catch (err) {
      console.error('Error al cargar municipios:', err);
      alert('❌ Error al cargar municipios');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación básica
    if (!formData.orden || !formData.posicion) {
      alert('⚠️ Los campos "Orden" y "Posición" son obligatorios');
      return;
    }

    if (!formData.id_organizacion || !formData.id_cargo) {
      alert('⚠️ Seleccione Organización y Cargo');
      return;
    }

    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      alert('⚠️ Nombres y Apellidos son obligatorios');
      return;
    }

    const payload = {
      ...formData,
      orden: parseInt(formData.orden, 10),
      posicion: parseInt(formData.posicion, 10),
      id_departamento: formData.id_departamento || null,
      id_provincia: formData.id_provincia || null,
      id_municipio: formData.id_municipio || null,
      edad: formData.edad ? parseInt(formData.edad, 10) : null
    };

    try {
      await api.post('/candidatos', payload);
      alert('✅ Candidato registrado exitosamente');
      setFormData({
        orden: '',
        posicion: '',
        id_organizacion: '',
        id_cargo: '',
        id_departamento: '',
        id_provincia: '',
        id_municipio: '',
        nombres: '',
        apellidos: '',
        genero: 'M',
        edad: '',
        tipo_candidatura: 'TITULAR'
      });
      setCatalogs(prev => ({ ...prev, provincias: {}, municipios: {} }));
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error desconocido al registrar candidato';
      alert(`❌ ${msg}`);
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">👤 Registro de Candidato</h1>
      <form onSubmit={handleSubmit}>
        {/* Orden y Posición */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            min="1"
            placeholder="Orden"
            value={formData.orden}
            onChange={e => setFormData({ ...formData, orden: e.target.value })}
            className="p-2 border rounded"
            required
          />
          <input
            type="number"
            min="1"
            placeholder="Posición"
            value={formData.posicion}
            onChange={e => setFormData({ ...formData, posicion: e.target.value })}
            className="p-2 border rounded"
            required
          />
          <input
            placeholder="Nombres"
            value={formData.nombres}
            onChange={e => setFormData({ ...formData, nombres: e.target.value })}
            className="p-2 border rounded"
            required
          />
          <input
            placeholder="Apellidos"
            value={formData.apellidos}
            onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
            className="p-2 border rounded"
            required
          />
          <select
            value={formData.genero}
            onChange={e => setFormData({ ...formData, genero: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
          <input
            type="number"
            min="18"
            max="120"
            placeholder="Edad"
            value={formData.edad}
            onChange={e => setFormData({ ...formData, edad: e.target.value })}
            className="p-2 border rounded"
          />
          <select
            value={formData.tipo_candidatura}
            onChange={e => setFormData({ ...formData, tipo_candidatura: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="TITULAR">Titular</option>
            <option value="SUPLENTE">Suplente</option>
          </select>
          <select
            value={formData.id_organizacion}
            onChange={e => setFormData({ ...formData, id_organizacion: e.target.value })}
            className="p-2 border rounded"
            required
          >
            <option value="">Organización Política</option>
            {Object.entries(catalogs.organizaciones).map(([name, id]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            value={formData.id_cargo}
            onChange={e => setFormData({ ...formData, id_cargo: e.target.value })}
            className="p-2 border rounded"
            required
          >
            <option value="">Cargo</option>
            {Object.entries(catalogs.cargos).map(([name, id]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        {/* Geografía */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">📍 Ubicación Geográfica</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={formData.id_departamento}
              onChange={e => handleDeptoChange(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Departamento</option>
              {Object.entries(catalogs.departamentos).map(([name, id]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>

            <select
              value={formData.id_provincia}
              onChange={e => handleProvChange(e.target.value)}
              className="p-2 border rounded"
              disabled={!formData.id_departamento}
            >
              <option value="">Provincia</option>
              {Object.entries(catalogs.provincias).map(([name, id]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>

            <select
              value={formData.id_municipio}
              onChange={e => setFormData({ ...formData, id_municipio: e.target.value })}
              className="p-2 border rounded"
              disabled={!formData.id_provincia}
            >
              <option value="">Municipio</option>
              {Object.entries(catalogs.municipios).map(([name, id]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            💾 Registrar Candidato
          </button>
          <button
            type="button"
            onClick={() => navigate('/gestion-candidatos')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ⬅️ Volver a Gestión
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
          >
            <span>↩️</span>
            <span>Volver al Dashboard</span>
          </button>
        </div>
      </form>
    </div>
  );
}