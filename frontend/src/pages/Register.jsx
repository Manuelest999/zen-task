import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !confirmPassword) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data) {
        // Mostrar el primer error legible del backend si está disponible
        const data = err.response.data;
        const firstErrorKey = Object.keys(data)[0];
        const errorMsg = data[firstErrorKey];
        setError(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      } else {
        setError('Ocurrió un error al registrar el usuario.');
      }
    } finally {
      setLoading(false);
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
            Crear Cuenta
          </h1>
          <p className="text-muted text-sm">Regístrate para empezar a usar ZenTask</p>
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
            <label className="form-label" htmlFor="register-username">Usuario</label>
            <input
              id="register-username"
              placeholder="tu_usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Correo Electrónico</label>
            <input
              id="register-email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">Contraseña</label>
            <input
              id="register-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm-password">Confirmar Contraseña</label>
            <input
              id="register-confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            style={{ justifyContent: 'center', padding: 'var(--space-4)' }}
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-muted text-sm" style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary-light)', fontWeight: 'var(--weight-bold)' }}>
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
