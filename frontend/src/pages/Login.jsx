import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot-request' | 'forgot-verify' | 'forgot-reset'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para recuperación de contraseña
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Usuario o contraseña incorrectos.');
    }
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) {
      setError('El correo electrónico es requerido.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/password-reset/request/`, { email });
      setSuccess(response.data.message || 'Código enviado con éxito.');
      setMode('forgot-verify');
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error al solicitar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!code) {
      setError('El código es requerido.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/password-reset/verify/`, {
        email,
        code
      });
      setSuccess(response.data.message || 'Código verificado con éxito.');
      setMode('forgot-reset');
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto, expirado o inválido.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!code || !newPassword || !confirmNewPassword) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/password-reset/confirm/`, {
        email,
        code,
        password: newPassword
      });
      setSuccess(response.data.message || 'Contraseña restablecida con éxito.');
      setMode('login');
      setCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error al restablecer la contraseña.');
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
            ZenTask
          </h1>
          <p className="text-muted text-sm">
            {mode === 'login' && 'Inicia sesión para continuar'}
            {mode === 'forgot-request' && 'Recupera tu contraseña'}
            {mode === 'forgot-verify' && 'Ingresa el código recibido'}
            {mode === 'forgot-reset' && 'Establece tu nueva contraseña'}
          </p>
        </div>

        {error && (
          <p
            className="badge badge-danger"
            style={{ display: 'block', textAlign: 'center', marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="badge badge-success"
            style={{ display: 'block', textAlign: 'center', marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}
          >
            {success}
          </p>
        )}

        {mode === 'login' && (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-username">Usuario</label>
              <input
                id="login-username"
                placeholder="tu_usuario"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>Contraseña</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot-request'); setError(''); setSuccess(''); setEmail(''); setCode(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary-light)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 'var(--weight-bold)'
                  }}
                >
                  ¿La olvidaste?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: 'var(--space-4)' }}>
              Iniciar Sesión
            </button>
          </form>
        )}

        {mode === 'forgot-request' && (
          <form onSubmit={handleRequestCode} className="modal-form">
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">Correo Electrónico</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary w-full" 
              style={{ justifyContent: 'center', padding: 'var(--space-4)' }}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar código de recuperación'}
            </button>
            <button
              type="button"
              className="btn btn-secondary w-full"
              style={{ justifyContent: 'center', padding: 'var(--space-4)', marginTop: 'var(--space-2)' }}
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {mode === 'forgot-verify' && (
          <form onSubmit={handleVerifyCode} className="modal-form">
            <div className="form-group">
              <label className="form-label" htmlFor="verify-email">Correo Electrónico</label>
              <input
                id="verify-email"
                type="email"
                value={email}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-code">Código de 6 dígitos</label>
              <input
                id="confirm-code"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary w-full" 
              style={{ justifyContent: 'center', padding: 'var(--space-4)' }}
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
            <button
              type="button"
              className="btn btn-secondary w-full"
              style={{ justifyContent: 'center', padding: 'var(--space-4)', marginTop: 'var(--space-2)' }}
              onClick={() => { setMode('forgot-request'); setError(''); setSuccess(''); }}
            >
              Volver
            </button>
          </form>
        )}

        {mode === 'forgot-reset' && (
          <form onSubmit={handleConfirmReset} className="modal-form">
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Nueva Contraseña</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password-repeat">Confirmar Nueva Contraseña</label>
              <input
                id="confirm-password-repeat"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
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
              {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>
            <button
              type="button"
              className="btn btn-secondary w-full"
              style={{ justifyContent: 'center', padding: 'var(--space-4)', marginTop: 'var(--space-2)' }}
              onClick={() => { setMode('forgot-verify'); setError(''); setSuccess(''); }}
            >
              Volver
            </button>
          </form>
        )}

        {mode === 'login' && (
          <p className="text-muted text-sm" style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary-light)', fontWeight: 'var(--weight-bold)' }}>
              Regístrate
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;

