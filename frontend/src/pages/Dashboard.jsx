// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Get user role from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.nombre_rol || '');
    }
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
      'admin-actas': ['admin', 'supervisor'],
      'delegados': ['admin', 'supervisor', 'coordinador'],
      'gestion-organizaciones': ['admin'],
      'gestion-usuarios': ['admin'],
      'resultados': ['admin', 'supervisor', 'consultor'],
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

  const porcentaje = (valor, total) => total > 0 ? ((valor / total) * 100).toFixed(1) : 0;

  // Define dashboard buttons with their permissions
  const dashboardButtons = [
    {
      path: '/escrutinio-gobernacion',
      label: '🏛️ Acta Gobernación',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      permission: 'escrutinio-gobernacion'
    },
    {
      path: '/escrutinio-municipal',
      label: '🏘️ Acta Municipal',
      color: 'bg-emerald-600',
      hoverColor: 'hover:bg-emerald-700',
      permission: 'escrutinio-municipal'
    },
    {
      path: '/admin-actas',
      label: '📋 Administrar Actas',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      permission: 'admin-actas'
    },
    {
      path: '/delegados',
      label: '👥 Delegados',
      color: 'bg-indigo-600',
      hoverColor: 'hover:bg-indigo-700',
      permission: 'delegados'
    },
    {
      path: '/gestion-organizaciones',
      label: '🏛️ Organizaciones',
      color: 'bg-cyan-600',
      hoverColor: 'hover:bg-cyan-700',
      permission: 'gestion-organizaciones'
    },
    {
      path: '/gestion-usuarios',
      label: '👤 Gestión de Usuarios',
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      permission: 'gestion-usuarios'
    },
    {
      path: '/resultados',
      label: '📊 Resultados',
      color: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
      permission: 'resultados'
    },
    {
      path: '/gestion-coord-distrito',
      label: '👥 Coord. Distrito',
      color: 'bg-teal-600',
      hoverColor: 'hover:bg-teal-700',
      permission: 'gestion-coord-distrito'
    },
    {
      path: '/gestion-coord-recinto',
      label: '🏢 Coord. Recinto',
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      permission: 'gestion-coord-recinto'
    }
  ];

  // Filter buttons based on user permissions
  const filteredButtons = dashboardButtons.filter(button => hasPermission(button.permission));

  const handleLogout = () => {
    // Limpiar completamente el almacenamiento local
    localStorage.clear();
    // Redirigir al login
    navigate('/login');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Panel de Control Electoral</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Display user role */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">Rol actual: <span className="font-semibold">{userRole || 'No definido'}</span></p>
      </div>

      {/* Botones de acción con control de acceso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {filteredButtons.map((button, index) => (
          <button
            key={index}
            onClick={() => navigate(button.path)}
            className={`px-4 py-3 ${button.color} text-white rounded-lg font-medium ${button.hoverColor} transition flex items-center justify-center gap-2`}
          >
            {button.label}
          </button>
        ))}
      </div>
      
      {/* Message when no buttons are available */}
      {filteredButtons.length === 0 && (
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-yellow-700 font-medium">No tienes permisos para acceder a ninguna funcionalidad.</p>
          <p className="text-yellow-600 mt-2">Contacta al administrador para solicitar permisos adicionales.</p>
        </div>
      )}
    </div>
  );
}