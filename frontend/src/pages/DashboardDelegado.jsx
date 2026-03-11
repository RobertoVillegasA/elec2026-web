// frontend/src/pages/DashboardDelegado.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DashboardDelegado() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [delegadoData, setDelegadoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = localStorage.getItem('user');
        if (storedUserData) {
          const user = JSON.parse(storedUserData);
          setUserData(user);

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

    // Update clock every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mb-4"></div>
          <p className="text-white text-lg">Cargando información...</p>
        </div>
      </div>
    );
  }

  const infoCards = [
    { label: 'Nombre', value: delegadoData ? `${delegadoData.nombre} ${delegadoData.apellido}` : 'N/A', icon: '👤' },
    { label: 'CI', value: delegadoData?.ci || 'N/A', icon: '🆔' },
    { label: 'Teléfono', value: delegadoData?.telefono || 'No proporcionado', icon: '📱' },
    { label: 'Organización', value: delegadoData?.organizacion_sigla || 'N/A', icon: '🏛️', gradient: true },
    { label: 'Recinto', value: delegadoData?.recinto || 'N/A', icon: '🏢' },
    { label: 'Mesa', value: delegadoData?.numero_mesa ? `#${delegadoData.numero_mesa}` : 'N/A', icon: '🔢', gradient: true }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Animated background pattern */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-2xl shadow-lg animate-pulse">
                  📋
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Panel de Delegado
                  </h1>
                  <p className="text-sm text-emerald-200">Gestión de actas electorales</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-white font-semibold">{userData?.fullname || 'Usuario'}</p>
                  <p className="text-xs text-emerald-300 capitalize">{userData?.nombre_rol || 'Delegado'}</p>
                  <p className="text-xs text-emerald-400">{formatTime(currentTime)}</p>
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
                  ¡Bienvenido, {userData?.fullname?.split(' ')[0] || 'Delegado'}! 👋
                </h2>
                <p className="text-emerald-200">
                  Organización: <span className="font-semibold text-white">{delegadoData?.organizacion_sigla || 'N/A'}</span>
                </p>
                <p className="text-sm text-emerald-300 mt-1">{formatDate(currentTime)}</p>
              </div>
              <div className="flex gap-3">
                <div className="px-4 py-3 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl border border-emerald-500/30">
                  <p className="text-emerald-400 text-xs font-medium">Mesa</p>
                  <p className="text-2xl font-bold text-emerald-300">#{delegadoData?.numero_mesa || 'N/A'}</p>
                </div>
                <div className="px-4 py-3 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-xl border border-blue-500/30">
                  <p className="text-blue-400 text-xs font-medium">Recinto</p>
                  <p className="text-lg font-bold text-blue-300 max-w-[150px] truncate">{delegadoData?.recinto || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {infoCards.map((card, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden p-6 rounded-2xl bg-white/10 backdrop-blur-lg 
                  border border-white/20 shadow-lg hover:shadow-xl hover:shadow-emerald-500/20
                  hover:scale-105 hover:-translate-y-1 transform transition-all duration-300 ease-out
                  ${card.gradient ? 'bg-gradient-to-br from-emerald-600/30 to-green-600/30' : ''}
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out">
                </div>
                
                <div className="relative z-10">
                  <div className="text-4xl mb-3 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    {card.icon}
                  </div>
                  <p className="text-emerald-200 text-sm mb-1">{card.label}</p>
                  <p className="text-white font-bold text-lg truncate">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              Acciones Disponibles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <button
                onClick={() => navigate('/escrutinio/general')}
                className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600
                  text-white shadow-lg shadow-violet-500/50
                  hover:shadow-2xl hover:shadow-violet-500/50
                  hover:scale-105 hover:-translate-y-1
                  transform transition-all duration-300 ease-out
                  border border-white/20 backdrop-blur-sm
                "
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out">
                </div>

                <div className="relative z-10 text-center">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    🗳️
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Escrutinio General</h3>
                  <p className="text-white/80">Registrar votos de Municipal y Gobernación</p>

                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/mapa-geografico')}
                className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600
                  text-white shadow-lg shadow-green-500/50
                  hover:shadow-2xl hover:shadow-green-500/50
                  hover:scale-105 hover:-translate-y-1
                  transform transition-all duration-300 ease-out
                  border border-white/20 backdrop-blur-sm
                "
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out">
                </div>

                <div className="relative z-10 text-center">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    🗺️
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Mapa Geográfico</h3>
                  <p className="text-white/80">Ver ubicación de recintos y mesas</p>

                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Info Card */}
          {delegadoData && (
            <div className="mt-8 p-6 bg-gradient-to-r from-emerald-600/20 to-green-600/20 backdrop-blur-lg rounded-2xl border border-emerald-500/30">
              <div className="flex items-start gap-4">
                <div className="text-4xl">💡</div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Información Importante</h3>
                  <p className="text-emerald-200 text-sm leading-relaxed">
                    Como delegado de <strong className="text-white">{delegadoData.organizacion_sigla}</strong> en la 
                    Mesa #{delegadoData.numero_mesa} del recinto <strong className="text-white">{delegadoData.recinto}</strong>, 
                    tienes la responsabilidad de registrar los votos de manera precisa y oportuna.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-emerald-300 text-sm">
              © 2026 Sistema Electoral Bolivia - Panel de Delegado
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2 mx-auto"
            >
              <span>↩️</span>
              <span>Volver al Dashboard</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}