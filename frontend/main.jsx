// ✅ frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

// Verifica si ya existe una raíz para evitar duplicados en desarrollo
let root = ReactDOM.createRoot(container);

const renderApp = () => {
  root.render(<App />);
};

// Renderiza la app
renderApp();

// Soporte para HMR en desarrollo
if (import.meta.hot) {
  import.meta.hot.accept('./App', () => {
    // Vuelve a renderizar sin crear una nueva raíz
    renderApp();
  });
}