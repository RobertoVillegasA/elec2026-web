import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardCoord from './pages/DashboardCoord';
import DashboardDelegado from './pages/DashboardDelegado';
import DashboardGestion from './pages/DashboardGestion';
import Escrutinio from './pages/Escrutinio';
import EscrutinioGobernacion from './pages/EscrutinioGobernacion';
import EscrutinioMunicipal from './pages/EscrutinioMunicipal';
import EscrutinioGeneral from './pages/EscrutinioGeneral';
import Candidatos from './pages/Candidatos';
import Delegados from './pages/Delegados';
import GeoAdmin from './pages/GeoAdmin';
import Resultados from './pages/Resultados';
import GestionCandidatos from './pages/GestionCandidatos';
import EscrutinioSubnacional from './pages/EscrutinioSubnacional';
import AdminActas from './pages/AdminActas';
import GestionUsuarios from './pages/GestionUsuarios';
import GestionOrganizaciones from './pages/GestionOrganizaciones';
import GestionCordDistrito from './pages/GestionCordDistrito';
import GestionCordRecinto from './pages/GestionCordRecinto';
import GestionRoles from './pages/GestionRoles';
import MapaGeografico from './pages/MapaGeografico';

// Función para decodificar el token JWT y verificar si ha expirado
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error decodificando el token:', error);
    return true; // Si hay un error, asumimos que el token es inválido
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
    } else {
      // Si el token está expirado o no existe, limpiar el almacenamiento
      if (token) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  // Function to determine if user is a coordinator
  const isCoordinator = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const roleName = user.nombre_rol || '';
        console.log('Rol detectado:', roleName); // Para debugging
        // Convertir a minúsculas y quitar espacios extras
        const lowerRole = roleName.toLowerCase().trim();
        // Verificar si es exactamente alguno de los roles de coordinador
        const coordinatorRoles = [
          'coordinador',
          'coordinador recinto',
          'coordinador distrito',
          'coord. recinto',
          'coord. distrito',
          'coord_recinto',
          'coord_distrito',
          'cord_recinto',
          'cord_distrito'
        ];
        const isCoord = coordinatorRoles.some(coordRole => lowerRole.includes(coordRole));
        console.log('¿Es coordinador?', isCoord); // Para debugging
        return isCoord;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return false;
      }
    }
    return false;
  };

  // Function to determine if user is a delegado
  const isDelegado = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const roleName = user.nombre_rol || '';
        console.log('Rol detectado:', roleName); // Para debugging
        // Convertir a minúsculas y quitar espacios extras
        const lowerRole = roleName.toLowerCase().trim();
        // Verificar si contiene la palabra delegado
        const isDel = lowerRole.includes('delegado');
        console.log('¿Es delegado?', isDel); // Para debugging
        return isDel;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return false;
      }
    }
    return false;
  };

  if (isLoading) return <div>Cargando...</div>;

  return (
    <BrowserRouter
		future={{
		v7_startTransition: true,
		v7_relativeSplatPath: true
		}}
	>

      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              isDelegado() ? <DashboardDelegado /> :
              isCoordinator() ? <DashboardCoord /> : <Dashboard />
            ) : <Navigate to="/login" />
          }
        />
        <Route
          path="/escrutinio"
          element={isAuthenticated ? <Escrutinio /> : <Navigate to="/login" />}
        />
        <Route
          path="/escrutinio-gobernacion"
          element={isAuthenticated ? <EscrutinioGobernacion /> : <Navigate to="/login" />}
        />
        <Route
          path="/escrutinio-municipal"
          element={isAuthenticated ? <EscrutinioMunicipal /> : <Navigate to="/login" />}
        />
		<Route
		  path="/escrutinio/subnacional"
		  element={isAuthenticated ? <EscrutinioSubnacional /> : <Navigate to="/login" />}
		/>
        <Route
          path="/escrutinio/general"
          element={isAuthenticated ? <EscrutinioGeneral /> : <Navigate to="/login" />}
        />
        <Route
          path="/candidatos"
          element={isAuthenticated ? <Candidatos /> : <Navigate to="/login" />}
        />
		<Route
          path="/gestion-candidatos"
		  element={isAuthenticated ? <GestionCandidatos /> : <Navigate to="/login" />}
		/>
        <Route
          path="/delegados"
          element={isAuthenticated ? <Delegados /> : <Navigate to="/login" />}
        />
        <Route
          path="/geo-admin"
          element={isAuthenticated ? <GeoAdmin /> : <Navigate to="/login" />}
        />
        <Route
          path="/resultados"
          element={isAuthenticated ? <Resultados /> : <Navigate to="/login" />}
        />
		<Route
		  path="/admin-actas"
		  element={isAuthenticated ? <AdminActas /> : <Navigate to="/login" />}
        />
		<Route
		  path="/gestion-usuarios"
		  element={isAuthenticated ? <GestionUsuarios /> : <Navigate to="/login" />}
        />
		<Route
		  path="/gestion-organizaciones"
		  element={isAuthenticated ? <GestionOrganizaciones /> : <Navigate to="/login" />}
        />
		<Route
		  path="/gestion-coord-distrito"
		  element={isAuthenticated ? <GestionCordDistrito /> : <Navigate to="/login" />}
        />
		<Route
		  path="/gestion-coord-recinto"
		  element={isAuthenticated ? <GestionCordRecinto /> : <Navigate to="/login" />}
        />
		<Route
		  path="/gestion-roles"
		  element={isAuthenticated ? <GestionRoles /> : <Navigate to="/login" />}
        />
		<Route
		  path="/mapa-geografico"
		  element={isAuthenticated ? <MapaGeografico /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard-gestion"
          element={isAuthenticated ? <DashboardGestion /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;