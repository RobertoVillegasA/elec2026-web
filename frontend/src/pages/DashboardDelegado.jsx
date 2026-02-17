// frontend/src/pages/DashboardDelegado.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DashboardDelegado() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [delegadoData, setDelegadoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Obtener datos del usuario desde localStorage
        const storedUserData = localStorage.getItem('user');
        if (storedUserData) {
          const user = JSON.parse(storedUserData);
          setUserData(user);

          // Buscar el delegado asociado a este usuario (por CI)
          const delegadosResponse = await api.get('/api/delegados/listar');
          const delegado = delegadosResponse.data.find(d => d.ci === user.username);
          if (delegado) {
            setDelegadoData(delegado);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos del delegado', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = () => {
    // Limpiar completamente el almacenamiento local
    localStorage.clear();
    // Redirigir al login
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Cargando información del delegado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📋 Panel de Control - Delegado</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Información del usuario/delegado */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Información Personal</h2>
        
        {userData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nombre Completo</p>
              <p className="text-lg font-semibold">{userData.fullname}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rol</p>
              <p className="text-lg font-semibold">{userData.nombre_rol}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Usuario</p>
              <p className="text-lg font-semibold">{userData.username}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No se pudieron cargar los datos del usuario</p>
        )}
      </div>

      {/* Información del delegado */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Información de Delegado</h2>
        
        {delegadoData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nombre</p>
              <p className="text-lg font-semibold">{delegadoData.nombre} {delegadoData.apellido}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CI</p>
              <p className="text-lg font-semibold">{delegadoData.ci}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Teléfono</p>
              <p className="text-lg font-semibold">{delegadoData.telefono || 'No proporcionado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Organización Política</p>
              <p className="text-lg font-semibold">{delegadoData.organizacion_sigla}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Recinto</p>
              <p className="text-lg font-semibold">{delegadoData.recinto}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mesa</p>
              <p className="text-lg font-semibold">#{delegadoData.numero_mesa}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No se encontró información de delegado asociada a este usuario</p>
        )}
      </div>

      {/* Botones de escrutinio */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Acciones Disponibles</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/escrutinio-municipal')}
            className="px-6 py-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2"
          >
            <span className="text-2xl">🗳️</span>
            <span className="text-lg">Escrutinio Municipal</span>
          </button>
          <button
            onClick={() => navigate('/escrutinio-gobernacion')}
            className="px-6 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <span className="text-2xl">🏛️</span>
            <span className="text-lg">Escrutinio Gobernación</span>
          </button>
        </div>
      </div>
    </div>
  );
}