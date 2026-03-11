// frontend/src/pages/GestionCordRecinto.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GestionCordRecinto() {
  const navigate = useNavigate();
  const [coordinadores, setCoordinadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Catálogos geográficos
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [recintos, setRecintos] = useState([]);

  // Estados para el formulario
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    ci: '',
    telefono: '',
    direccion: '',
    id_recinto: '',
    id_rol: 5  // 5 = Coord_recinto
  });

  // Estados para selección geográfica en formulario
  const [formIdDepartamento, setFormIdDepartamento] = useState('');
  const [formIdProvincia, setFormIdProvincia] = useState('');
  const [formIdMunicipio, setFormIdMunicipio] = useState('');

  // Estados para confirmación de eliminación
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Estado para búsqueda de recintos
  const [searchRecinto, setSearchRecinto] = useState('');

  // Cargar coordinadores y catálogos al iniciar
  useEffect(() => {
    loadCoordinadores();
    loadDepartamentos();
  }, []);

  const loadCoordinadores = async () => {
    try {
      setLoading(true);
      // Usar el endpoint unificado con filtro por rol (5 = Coord_recinto)
      const response = await api.get('/api/delegados/listar?id_rol=5');
      setCoordinadores(response.data || []);
    } catch (err) {
      console.error('Error al cargar coordinadores de recinto', err);
      setError('❌ Error al cargar los coordinadores de recinto');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartamentos = async () => {
    try {
      const response = await api.get('/api/catalog?table=departamentos');
      setDepartamentos(Object.entries(response.data).map(([nombre, id]) => ({ id, nombre })));
    } catch (err) {
      console.error('Error al cargar departamentos', err);
    }
  };

  const loadProvincias = async (idDepartamento) => {
    try {
      const response = await api.get(`/api/provincias/departamento/${idDepartamento}`);
      const provs = Object.entries(response.data).map(([nombre, id]) => ({ id, nombre }));
      setProvincias(provs);
      setMunicipios([]);
      setRecintos([]);
    } catch (err) {
      console.error('Error al cargar provincias', err);
    }
  };

  const loadMunicipios = async (idProvincia) => {
    try {
      console.log('Cargando municipios para provincia:', idProvincia);
      const response = await api.get(`/api/municipios/provincia/${idProvincia}`);
      console.log('Respuesta de municipios:', response.data);
      const munis = Object.entries(response.data || {}).map(([nombre, id]) => ({ id, nombre }));
      console.log('Municipios procesados:', munis);
      setMunicipios(munis);
      setRecintos([]);
    } catch (err) {
      console.error('Error al cargar municipios', err);
      setMunicipios([]);
    }
  };

  const loadRecintos = async (idMunicipio) => {
    try {
      console.log('Cargando recintos para municipio:', idMunicipio);
      const response = await api.get(`/api/recintos/municipio/${idMunicipio}`);
      console.log('Respuesta de recintos:', response.data);
      
      // La API devuelve un objeto {nombre: id}, convertir a array de objetos {id, nombre}
      const recs = Object.entries(response.data || {}).map(([nombre, id]) => ({ id, nombre }));
      console.log('Recintos procesados:', recs);
      setRecintos(recs);
    } catch (err) {
      console.error('Error al cargar recintos', err);
      setRecintos([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('❌ El nombre es obligatorio');
      return false;
    }
    if (!formData.apellido.trim()) {
      setError('❌ El apellido es obligatorio');
      return false;
    }
    if (!formData.ci.trim()) {
      setError('❌ El CI es obligatorio');
      return false;
    }
    if (!formData.id_recinto) {
      setError('❌ El recinto es obligatorio');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/delegados/${editingId}`, formData);
        setSuccess('✅ Coordinador actualizado exitosamente');
        setEditingId(null);
      } else {
        const response = await api.post('/api/delegados', formData);
        const datos = response.data;
        
        if (datos.username && datos.password) {
          setSuccess(`✅ Coordinador registrado exitosamente.\n\n📋 DATOS DE ACCESO:\n👤 Usuario: ${datos.username}\n🔑 Contraseña: ${datos.password}`);
        } else {
          setSuccess('✅ Coordinador registrado exitosamente');
        }
      }

      setShowForm(false);
      setFormData({
        nombre: '',
        apellido: '',
        ci: '',
        telefono: '',
        direccion: '',
        id_recinto: '',
        id_rol: 5
      });
      loadCoordinadores();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al guardar', err);
      setError(err.response?.data?.detail || '❌ Error al guardar');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (coord) => {
    setFormData({
      nombre: coord.nombre,
      apellido: coord.apellido,
      ci: coord.ci,
      telefono: coord.telefono || '',
      direccion: coord.direccion || '',
      id_recinto: coord.id_recinto || '',
      id_rol: 5
    });
    setEditingId(coord.id_delegado);
    setShowForm(true);
    
    // Cargar cascada geográfica si hay datos
    if (coord.id_departamento) {
      setFormIdDepartamento(coord.id_departamento);
      loadProvincias(coord.id_departamento);
      if (coord.id_provincia) {
        setFormIdProvincia(coord.id_provincia);
        loadMunicipios(coord.id_provincia);
        if (coord.id_municipio) {
          setFormIdMunicipio(coord.id_municipio);
          loadRecintos(coord.id_municipio);
        }
      }
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async (id) => {
    try {
      await api.delete(`/api/delegados/eliminar/${id}`);
      setSuccess('✅ Coordinador eliminado exitosamente');
      setDeleteConfirm(null);
      loadCoordinadores();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ Error al eliminar');
      setTimeout(() => setError(''), 3000);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      nombre: '',
      apellido: '',
      ci: '',
      telefono: '',
      direccion: '',
      id_recinto: '',
      id_rol: 5
    });
    setFormIdDepartamento('');
    setFormIdProvincia('');
    setFormIdMunicipio('');
  };

  // Filtrar recintos por búsqueda
  const recintosFiltrados = recintos.filter(rec =>
    rec.nombre.toLowerCase().includes(searchRecinto.toLowerCase())
  );

  const handleFormDepartamentoChange = async (idDepto) => {
    setFormIdDepartamento(idDepto);
    setFormIdProvincia('');
    setFormIdMunicipio('');
    setFormData(prev => ({ ...prev, id_recinto: '' }));
    setProvincias([]);
    setMunicipios([]);
    setRecintos([]);
    if (idDepto) {
      await loadProvincias(idDepto);
    }
  };

  const handleFormProvinciaChange = async (idProv) => {
    setFormIdProvincia(idProv);
    setFormIdMunicipio('');
    setFormData(prev => ({ ...prev, id_recinto: '' }));
    setMunicipios([]);
    setRecintos([]);
    if (idProv) {
      await loadMunicipios(idProv);
    }
  };

  const handleFormMunicipioChange = async (idMuni) => {
    console.log('Cambiando municipio a:', idMuni);
    setFormIdMunicipio(idMuni);
    setFormData(prev => ({ ...prev, id_recinto: '' }));
    setRecintos([]);
    if (idMuni) {
      console.log('Llamando a loadRecintos con:', idMuni);
      await loadRecintos(idMuni);
    } else {
      console.log('Municipio no seleccionado, no cargar recintos');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📋 Gestión de Coordinadores de Recinto</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
        >
          ↩️ Volver al Dashboard
        </button>
      </div>

      {/* Mensajes */}
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border border-red-200">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 border border-green-200">{success}</div>}

      {/* Panel de Control */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Coordinadores Registrados</h2>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                nombre: '',
                apellido: '',
                ci: '',
                telefono: '',
                direccion: '',
                id_recinto: '',
                id_rol: 5
              });
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/30"
          >
            {showForm ? '❌ Cancelar' : '➕ Nuevo Coordinador'}
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingId ? '✏️ Editar Coordinador' : '📝 Nuevo Coordinador'}
            </h3>

            {/* Ubicación Geográfica */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <select
                  value={formIdDepartamento}
                  onChange={(e) => handleFormDepartamentoChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccione...</option>
                  {departamentos.map(depto => (
                    <option key={depto.id} value={depto.id}>{depto.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <select
                  value={formIdProvincia}
                  onChange={(e) => handleFormProvinciaChange(e.target.value)}
                  disabled={!formIdDepartamento}
                  className="w-full p-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                >
                  <option value="">Seleccione...</option>
                  {provincias.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                <select
                  value={formIdMunicipio}
                  onChange={(e) => handleFormMunicipioChange(e.target.value)}
                  disabled={!formIdProvincia}
                  className="w-full p-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                >
                  <option value="">Seleccione...</option>
                  {municipios.map(muni => (
                    <option key={muni.id} value={muni.id}>{muni.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recinto</label>
                <input
                  type="text"
                  value={searchRecinto}
                  onChange={(e) => setSearchRecinto(e.target.value)}
                  placeholder="🔍 Buscar..."
                  disabled={!formIdMunicipio}
                  className="w-full p-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CI</label>
                <input
                  type="text"
                  name="ci"
                  value={formData.ci}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <textarea
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows="2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Recinto (seleccione después de buscar)</label>
                <select
                  name="id_recinto"
                  value={formData.id_recinto}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto"
                  disabled={!formIdMunicipio}
                  required
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
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium transition-all duration-300"
              >
                {editingId ? '💾 Actualizar' : '💾 Registrar'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Tabla */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">CI</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Teléfono</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Recinto</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Dirección</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coordinadores.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No hay coordinadores registrados
                    </td>
                  </tr>
                ) : (
                  coordinadores.map((coord) => (
                    <tr key={coord.id_delegado} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{coord.nombre} {coord.apellido}</td>
                      <td className="py-3 px-4 font-mono text-sm">{coord.ci}</td>
                      <td className="py-3 px-4 text-sm">{coord.telefono || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {coord.recinto || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm max-w-xs truncate">{coord.direccion || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleEdit(coord)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm mr-2"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(coord.id_delegado)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminar */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-4">⚠️ Confirmar Eliminación</h3>
            <p className="text-gray-700 mb-6">
              ¿Está seguro de que desea eliminar este coordinador de recinto? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón Volver al Dashboard */}
      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 mx-auto"
        >
          <span>↩️</span>
          <span>Volver al Dashboard</span>
        </button>
      </div>
    </div>
  );
}
