// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/auth/login', formData);
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      console.error("Error login:", err.response || err);
      setError('❌ Usuario o contraseña incorrectos');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center', color: '#1e3a8a', marginBottom: '0.5rem' }}>🇧🇴 Sistema Electoral Bolivia 2026</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem' }}>🔐 Inicio de Sesión</p>
        {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>👤 Usuario</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              required
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>🔑 Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🚀 Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}