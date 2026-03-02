// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.nombre_rol || '');
      setUserName(user.nombre || user.username || 'Usuario');
    }

    // Update clock every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Define role-based permissions
  const hasPermission = (feature) => {
    // Administrador has access to everything
    if (userRole.toLowerCase().includes('administrador') || userRole.toLowerCase().includes('admin')) {
      return true;
    }

    // Define specific permissions for other roles
    const permissions = {
      'escrutinio-gobernacion': ['admin', 'supervisor', 'coordinador'],
      'escrutinio-municipal': ['admin', 'supervisor', 'coordinador'],
      'escrutinio-general': ['admin', 'supervisor', 'coordinador', 'delegado'],
      'admin-actas': ['admin', 'supervisor', 'coordinador'],
      'mapa-geografico': ['admin', 'supervisor', 'coordinador', 'consultor', 'delegado'],
      'delegados': ['admin', 'supervisor', 'coordinador'],
      'gestion-organizaciones': ['admin'],
      'gestion-usuarios': ['admin'],
      'resultados': ['admin', 'supervisor', 'consultor', 'coordinador', 'delegado'],
      'gestion-coord-distrito': ['admin'],
      'gestion-coord-recinto': ['admin']
    };

    // Normalize user role for comparison
    const normalizedRole = userRole.toLowerCase().replace(/\s+/g, '');

    if (permissions[feature]) {
      return permissions[feature].some(role => normalizedRole.includes(role));
    }

    return false;
  };

  const handleLogout = () => {
    // Limpiar completamente el almacenamiento local
    localStorage.clear();
    // Recargar la página para asegurar que se limpie la caché
    window.location.reload();
    // Redirigir al login
    navigate('/login');
  };

  // Define dashboard buttons with their permissions
  const dashboardButtons = [
    {
      path: '/escrutinio/general',
      label: 'Escrutinio General',
      description: 'Municipal + Gobernación',
      icon: '🗳️',
      gradient: 'from-violet-600 via-purple-600 to-blue-600',
      shadow: 'shadow-violet-500/50',
      permission: 'escrutinio-general',
      featured: true
    },
    {
      path: '/escrutinio-gobernacion',
      label: 'Acta Gobernación',
      description: 'Votos departamentales',
      icon: '🏛️',
      gradient: 'from-blue-500 to-cyan-600',
      shadow: 'shadow-blue-500/50',
      permission: 'escrutinio-gobernacion'
    },
    {
      path: '/escrutinio-municipal',
      label: 'Acta Municipal',
      description: 'Votos municipales',
      icon: '🏘️',
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/50',
      permission: 'escrutinio-municipal'
    },
    {
      path: '/admin-actas',
      label: 'Administrar Actas',
      description: 'Gestión de documentos',
      icon: '📋',
      gradient: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/50',
      permission: 'admin-actas'
    },
    {
      path: '/mapa-geografico',
      label: 'Mapa Geográfico',
      description: 'Ubicación de recintos',
      icon: '🗺️',
      gradient: 'from-green-500 to-emerald-600',
      shadow: 'shadow-green-500/50',
      permission: 'mapa-geografico'
    },
    {
      path: '/delegados',
      label: 'Delegados',
      description: 'Gestión de delegados',
      icon: '👥',
      gradient: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-500/50',
      permission: 'delegados'
    },
    {
      path: '/gestion-organizaciones',
      label: 'Organizaciones',
      description: 'Partidos políticos',
      icon: '🏛️',
      gradient: 'from-cyan-500 to-blue-600',
      shadow: 'shadow-cyan-500/50',
      permission: 'gestion-organizaciones'
    },
    {
      path: '/gestion-usuarios',
      label: 'Usuarios',
      description: 'Administración de usuarios',
      icon: '👤',
      gradient: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/50',
      permission: 'gestion-usuarios'
    },
    {
      path: '/resultados',
      label: 'Resultados',
      description: 'Ver resultados electorales',
      icon: '📊',
      gradient: 'from-orange-500 to-red-600',
      shadow: 'shadow-orange-500/50',
      permission: 'resultados'
    },
    {
      path: '/gestion-coord-distrito',
      label: 'Coord. Distrito',
      description: 'Coordinadores distritales',
      icon: '🌐',
      gradient: 'from-teal-500 to-cyan-600',
      shadow: 'shadow-teal-500/50',
      permission: 'gestion-coord-distrito'
    },
    {
      path: '/gestion-coord-recinto',
      label: 'Coord. Recinto',
      description: 'Coordinadores de recinto',
      icon: '🏢',
      gradient: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-500/50',
      permission: 'gestion-coord-recinto'
    }
  ];

  // Filter buttons based on user permissions
  const filteredButtons = dashboardButtons.filter(button => hasPermission(button.permission));

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background pattern */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo and Title */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-red-500 rounded-xl flex items-center justify-center text-2xl shadow-lg animate-pulse">
                  🇧🇴
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Sistema Electoral Bolivia 2026
                  </h1>
                  <p className="text-sm text-purple-200">Panel de Control Electoral</p>
                </div>
              </div>

              {/* User Info and Logout */}
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-white font-semibold">{userName}</p>
                  <p className="text-xs text-purple-300 capitalize">{userRole || 'Usuario'}</p>
                  <p className="text-xs text-purple-400">{formatTime(currentTime)}</p>
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
                  ¡Bienvenido, {userName}! 👋
                </h2>
                <p className="text-purple-200 capitalize">
                  Rol: <span className="font-semibold text-white">{userRole || 'No definido'}</span>
                </p>
                <p className="text-sm text-purple-300 mt-1">{formatDate(currentTime)}</p>
              </div>
              <div className="flex gap-3">
                <div className="px-4 py-3 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl border border-green-500/30">
                  <p className="text-green-400 text-xs font-medium">Funcionalidades</p>
                  <p className="text-2xl font-bold text-green-300">{filteredButtons.length}</p>
                </div>
                <div className="px-4 py-3 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-xl border border-blue-500/30">
                  <p className="text-blue-400 text-xs font-medium">Accesos</p>
                  <p className="text-2xl font-bold text-blue-300">{dashboardButtons.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          {filteredButtons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={() => navigate(button.path)}
                  className={`group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${button.gradient} 
                    text-white shadow-lg ${button.shadow} 
                    hover:shadow-2xl hover:shadow-white/20 
                    hover:scale-105 hover:-translate-y-1
                    transform transition-all duration-300 ease-out
                    ${button.featured ? 'sm:col-span-2 lg:col-span-2 xl:col-span-3' : ''}
                    border border-white/20 backdrop-blur-sm
                  `}
                >
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                    translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out">
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className={`text-5xl mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ${button.featured ? 'text-6xl' : ''}`}>
                      {button.icon}
                    </div>
                    <h3 className={`font-bold mb-1 text-left ${button.featured ? 'text-2xl' : 'text-lg'}`}>
                      {button.label}
                    </h3>
                    <p className={`text-white/80 text-left ${button.featured ? 'text-base' : 'text-sm'}`}>
                      {button.description}
                    </p>
                    
                    {/* Arrow indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <span className="text-2xl">→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* No permissions message */
            <div className="mt-8 p-8 bg-white/10 backdrop-blur-lg border border-yellow-500/30 rounded-2xl text-center shadow-xl">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-yellow-300 font-semibold text-lg">
                No tienes permisos para acceder a ninguna funcionalidad
              </p>
              <p className="text-yellow-400/80 mt-2">
                Contacta al administrador para solicitar permisos adicionales
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-purple-300 text-sm">
              © 2026 Sistema Electoral Bolivia - Todos los derechos reservados
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}