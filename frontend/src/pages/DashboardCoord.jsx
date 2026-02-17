// frontend/src/pages/DashboardCoord.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DashboardCoord() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('user');
    if (storedUserData) {
      const user = JSON.parse(storedUserData);
      setUserRole(user.nombre_rol || '');
      setUserData(user);
    }
  }, []);

  // Check if user is a coordinator (distrito or recinto)
  const isCoordinator = () => {
    const normalizedRole = userRole.toLowerCase().replace(/\s+/g, '');
    return normalizedRole.includes('coordinador') || normalizedRole.includes('coord.distrito') || normalizedRole.includes('coord.recinto');
  };

  const [delegados, setDelegados] = useState([]);
  const [loadingDelegados, setLoadingDelegados] = useState(true);
  const [recintoInfo, setRecintoInfo] = useState(null);

  // Determinar tipo de coordinador
  const isCoordDistrito = userRole.toLowerCase().includes('distrito');
  const isCoordRecinto = userRole.toLowerCase().includes('recinto');

  // Obtener el ID del usuario para buscar su recinto si es coordinador de recinto
  const userId = userData ? userData.id_usuario : null;

  useEffect(() => {
    if (isCoordRecinto && userId) {
      // Si es coordinador de recinto, cargar solo los delegados de su recinto
      loadDelegadosByRecinto();
      loadRecintoInfo();
    }
  }, [isCoordRecinto, userId]);

  const loadDelegadosByRecinto = async () => {
    try {
      setLoadingDelegados(true);
      // Primero obtener el recinto del coordinador
      const fullName = userData?.fullname || '';
      if (!fullName) {
        setDelegados([]);
        return;
      }

      // Dividir el nombre completo en nombre y apellido
      const nameParts = fullName.trim().split(' ');
      const nombre = nameParts[0];
      const apellido = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Buscar en la tabla de coordinadores de recinto por nombre y apellido
      const coordsResponse = await api.get('/api/cord_recinto');
      const coordinador = coordsResponse.data.find(coord => 
        coord.nombre.toLowerCase().includes(nombre.toLowerCase()) &&
        coord.apellido.toLowerCase().includes(apellido.toLowerCase())
      );

      if (coordinador && coordinador.id_recinto) {
        // Luego obtener los delegados de ese recinto usando el endpoint correcto
        const delegadosResponse = await api.get(`/api/delegados/listar?recinto=${coordinador.id_recinto}`);
        setDelegados(delegadosResponse.data || []);
      } else {
        setDelegados([]);
      }
    } catch (err) {
      console.error('Error al cargar delegados del recinto', err);
      setDelegados([]);
    } finally {
      setLoadingDelegados(false);
    }
  };

  const loadRecintoInfo = async () => {
    try {
      // Obtener el nombre completo del usuario
      const fullName = userData?.fullname || '';
      if (!fullName) return;

      // Dividir el nombre completo en nombre y apellido
      const nameParts = fullName.trim().split(' ');
      const nombre = nameParts[0];
      const apellido = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Buscar en la tabla de coordinadores de recinto por nombre y apellido
      const coordsResponse = await api.get('/api/cord_recinto');
      const coordinador = coordsResponse.data.find(coord => 
        coord.nombre.toLowerCase().includes(nombre.toLowerCase()) &&
        coord.apellido.toLowerCase().includes(apellido.toLowerCase())
      );

      if (coordinador && coordinador.id_recinto) {
        // Obtener información del recinto
        const recintoResponse = await api.get(`/api/catalog?table=recintos`);
        const recintoId = coordinador.id_recinto;
        // Buscar el nombre del recinto
        const recintoNombre = Object.keys(recintoResponse.data).find(
          key => recintoResponse.data[key] === recintoId
        );
        setRecintoInfo({
          id: recintoId,
          nombre: recintoNombre || `Recinto #${recintoId}`,
          coordinador: coordinador
        });
      }
    } catch (err) {
      console.error('Error al cargar información del recinto', err);
    }
  };

  const handleDeleteDelegado = async (idDelegado) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este delegado?')) {
      try {
        await api.delete(`/api/delegados/eliminar/${idDelegado}`); // Corregido el endpoint
        // Recargar la lista de delegados
        loadDelegadosByRecinto();
      } catch (err) {
        console.error('Error al eliminar delegado', err);
        alert('Error al eliminar el delegado');
      }
    }
  };

  const handleLogout = () => {
    // Limpiar completamente el almacenamiento local
    localStorage.clear();
    // Redirigir al login
    navigate('/login');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Panel de Control - Coordinador</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Display user role */}
      <div className="mb-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-sm text-gray-700">Rol actual: <span className="font-semibold">{userRole || 'No definido'}</span></p>
        {userData && userData.fullname && (
          <p className="text-sm text-gray-700">Bienvenido: <span className="font-semibold">{userData.fullname}</span></p>
        )}
        {isCoordRecinto && recintoInfo && (
          <p className="text-sm text-gray-700">Recinto: <span className="font-semibold">{recintoInfo.nombre}</span></p>
        )}
      </div>

      {/* Mensaje informativo */}
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700 font-medium">Como coordinador {(isCoordDistrito ? 'de distrito' : isCoordRecinto ? 'de recinto' : '')}, {(isCoordDistrito ? 'tienes acceso a la gestión de delegados y coordinadores.' : 'tienes acceso a la gestión de delegados.')}{isCoordRecinto && recintoInfo ? ` del recinto ${recintoInfo.nombre}.` : '.'}</p>
      </div>

      {/* Botones específicos para coordinadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => navigate('/delegados')}
          className="px-4 py-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex flex-col items-center justify-center gap-2 text-center"
        >
          <span className="text-2xl">👥</span>
          <span className="text-lg">Administrar Delegados</span>
        </button>
        
        {/* Mostrar el botón de gestión de coordinadores de recinto solo para coordinadores de distrito */}
        {isCoordDistrito && (
          <button
            onClick={() => navigate('/gestion-coord-recinto')}
            className="px-4 py-6 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex flex-col items-center justify-center gap-2 text-center"
          >
            <span className="text-2xl">🏢</span>
            <span className="text-lg">Gestión Coords. Recinto</span>
          </button>
        )}
      </div>

      {/* Tabla de delegados para coordinadores de recinto */}
      {isCoordRecinto && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Delegados de mi Recinto</h2>
          
          {loadingDelegados ? (
            <p className="text-center py-4 text-gray-600">Cargando delegados...</p>
          ) : delegados.length === 0 ? (
            <p className="text-center py-4 text-gray-600">No hay delegados asignados a tu recinto</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold">Nombre</th>
                    <th className="py-3 px-4 text-left font-semibold">Apellido</th>
                    <th className="py-3 px-4 text-left font-semibold">CI</th>
                    <th className="py-3 px-4 text-left font-semibold">Teléfono</th>
                    <th className="py-3 px-4 text-left font-semibold">Organización</th>
                    <th className="py-3 px-4 text-left font-semibold">Mesa</th>
                    <th className="py-3 px-4 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {delegados.map((delegado) => (
                    <tr key={delegado.id_delegado} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{delegado.nombre}</td>
                      <td className="py-3 px-4">{delegado.apellido}</td>
                      <td className="py-3 px-4 font-mono">{delegado.ci}</td>
                      <td className="py-3 px-4">{delegado.telefono || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {delegado.organizacion_sigla || delegado.organizacion || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          Mesa {delegado.numero_mesa || delegado.mesa || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteDelegado(delegado.id_delegado)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}