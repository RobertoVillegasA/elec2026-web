// frontend/src/pages/DashboardCoord.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DashboardCoord() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [userData, setUserData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('user');
    if (storedUserData) {
      const user = JSON.parse(storedUserData);
      setUserRole(user.nombre_rol || '');
      setUserData(user);
    }

    // Update clock every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
        await api.delete(`/api/delegados/eliminar/${idDelegado}`);
        // Recargar la lista de delegados
        loadDelegadosByRecinto();
      } catch (err) {
        console.error('Error al eliminar delegado', err);
        alert('Error al eliminar el delegado');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
    navigate('/login');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const actionButtons = [
    {
      path: '/escrutinio/general',
      label: 'Escrutinio General',
      description: 'Registrar votos',
      icon: '🗳️',
      gradient: 'from-violet-600 via-purple-600 to-blue-600',
      shadow: 'shadow-violet-500/50'
    },
    {
      path: '/delegados',
      label: 'Administrar Delegados',
      description: 'Gestión de delegados',
      icon: '👥',
      gradient: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-500/50'
    },
    ...(isCoordDistrito ? [{
      path: '/gestion-coord-recinto',
      label: 'Coords. Recinto',
      description: 'Gestionar coordinadores',
      icon: '🏢',
      gradient: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-500/50'
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background pattern */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center text-2xl shadow-lg animate-pulse">
                  🎯
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Panel de Coordinador
                  </h1>
                  <p className="text-sm text-blue-200">Gestión electoral distrital</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-white font-semibold">{userData?.fullname || 'Usuario'}</p>
                  <p className="text-xs text-blue-300 capitalize">{userRole || 'Coordinador'}</p>
                  <p className="text-xs text-blue-400">{formatTime(currentTime)}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="group px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-red-500/50 flex items-center gap-2"
                >
                  <span className="group-hover:rotate-12 transition-transform duration-300">🚪</span>
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8 p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  ¡Bienvenido, {userData?.fullname?.split(' ')[0] || 'Coordinador'}! 👋
                </h2>
                <p className="text-blue-200 capitalize">
                  Rol: <span className="font-semibold text-white">{userRole || 'Coordinador'}</span>
                </p>
                {isCoordRecinto && recintoInfo && (
                  <p className="text-blue-300 mt-1">
                    Recinto: <span className="font-semibold text-white">{recintoInfo.nombre}</span>
                  </p>
                )}
                <p className="text-sm text-blue-300 mt-1">{formatDate(currentTime)}</p>
              </div>
              <div className="flex gap-3">
                <div className="px-4 py-3 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl border border-green-500/30">
                  <p className="text-green-400 text-xs font-medium">Delegados</p>
                  <p className="text-2xl font-bold text-green-300">{delegados.length}</p>
                </div>
                <div className="px-4 py-3 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-xl border border-purple-500/30">
                  <p className="text-purple-400 text-xs font-medium">Accesos</p>
                  <p className="text-2xl font-bold text-purple-300">{actionButtons.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {actionButtons.map((button, index) => (
              <button
                key={index}
                onClick={() => navigate(button.path)}
                className={`group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${button.gradient} 
                  text-white shadow-lg ${button.shadow} 
                  hover:shadow-2xl hover:shadow-white/20 
                  hover:scale-105 hover:-translate-y-1
                  transform transition-all duration-300 ease-out
                  border border-white/20 backdrop-blur-sm
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out">
                </div>
                
                <div className="relative z-10 text-center">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    {button.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{button.label}</h3>
                  <p className="text-white/80 text-sm">{button.description}</p>
                  
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Delegados Table for Recinto Coordinators */}
          {isCoordRecinto && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">📋</span>
                  Delegados de mi Recinto
                </h2>
                {recintoInfo && (
                  <p className="text-blue-200 mt-1">{recintoInfo.nombre}</p>
                )}
              </div>

              {loadingDelegados ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="text-blue-200 mt-4">Cargando delegados...</p>
                </div>
              ) : delegados.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-blue-200 text-lg">No hay delegados asignados a tu recinto</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="py-4 px-4 text-left text-sm font-semibold text-blue-200">Nombre</th>
                        <th className="py-4 px-4 text-left text-sm font-semibold text-blue-200">Apellido</th>
                        <th className="py-4 px-4 text-left text-sm font-semibold text-blue-200">CI</th>
                        <th className="py-4 px-4 text-left text-sm font-semibold text-blue-200">Teléfono</th>
                        <th className="py-4 px-4 text-left text-sm font-semibold text-blue-200">Organización</th>
                        <th className="py-4 px-4 text-left text-sm font-semibold text-blue-200">Mesa</th>
                        <th className="py-4 px-4 text-center text-sm font-semibold text-blue-200">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {delegados.map((delegado, idx) => (
                        <tr 
                          key={delegado.id_delegado} 
                          className={`border-b border-white/10 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-white/5' : ''}`}
                        >
                          <td className="py-3 px-4 text-white">{delegado.nombre}</td>
                          <td className="py-3 px-4 text-white">{delegado.apellido}</td>
                          <td className="py-3 px-4 font-mono text-blue-200">{delegado.ci}</td>
                          <td className="py-3 px-4 text-blue-200">{delegado.telefono || '—'}</td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-300 rounded-lg text-xs font-medium border border-green-500/30">
                              {delegado.organizacion_sigla || delegado.organizacion || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-600/20 text-blue-300 rounded-lg text-xs font-medium border border-blue-500/30">
                              Mesa {delegado.numero_mesa || delegado.mesa || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteDelegado(delegado.id_delegado)}
                              className="group px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium text-sm transition-all duration-300 shadow-lg hover:shadow-red-500/50 flex items-center gap-2 mx-auto"
                            >
                              <span className="group-hover:rotate-12 transition-transform">🗑️</span>
                              <span className="hidden lg:inline">Eliminar</span>
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
        </main>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-blue-300 text-sm">
              © 2026 Sistema Electoral Bolivia - Panel de Coordinador
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}