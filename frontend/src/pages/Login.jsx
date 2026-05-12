import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Usuario o contraseña incorrectos.');
    }
  };

  return (
    <div className="loading-center" style={{ padding: 'var(--space-4)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: 'var(--space-10)' }}>

        <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--weight-black)',
              background: 'var(--gradient-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 'var(--space-2)',
            }}
          >
            ZenTask
          </h1>
          <p className="text-muted text-sm">Inicia sesión para continuar</p>
        </div>

        {error && (
          <p
            className="badge badge-danger"
            style={{ display: 'block', textAlign: 'center', marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Usuario</label>
            <input
              id="login-username"
              placeholder="tu_usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: 'var(--space-4)' }}>
            Iniciar Sesión
          </button>
        </form>

        <p className="text-muted text-sm" style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary-light)', fontWeight: 'var(--weight-bold)' }}>
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
