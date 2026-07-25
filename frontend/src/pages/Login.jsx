import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils';

// ── Constantes de seguridad ────────────────────────────────────────────────
const MAX_ATTEMPTS   = 5;       // intentos máximos antes de bloquear
const LOCKOUT_MS     = 5 * 60 * 1000; // 5 minutos de bloqueo
const MAX_FIELD_LEN  = 150;     // longitud máxima de cualquier campo

/** Elimina caracteres potencialmente peligrosos para XSS/SQL injection */
const sanitize = (str) =>
  String(str).replace(/[<>"'`;&\\]/g, '').trim().slice(0, MAX_FIELD_LEN);

/** Evalúa la fortaleza de la contraseña (0-4) */
const passwordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8)                   score++;
  if (pwd.length >= 12)                  score++;
  if (/[A-Z]/.test(pwd))                score++;
  if (/[0-9]/.test(pwd))                score++;
  if (/[^A-Za-z0-9]/.test(pwd))         score++;
  return Math.min(score, 4);
};

const STRENGTH_LABEL = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
const STRENGTH_COLOR = ['', 'var(--color-danger)', 'var(--color-warning)', 'var(--color-primary-light)', 'var(--color-success)'];

// ── Indicador de fortaleza de contraseña ──────────────────────────────────
const StrengthMeter = ({ password }) => {
  if (!password) return null;
  const level = passwordStrength(password);
  return (
    <div style={{ marginTop: 'var(--space-2)' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= level ? STRENGTH_COLOR[level] : 'var(--border)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
      <p style={{
        fontSize: 'var(--text-xs)',
        color: STRENGTH_COLOR[level],
        fontWeight: 'var(--weight-bold)',
        margin: 0,
      }}>
        {STRENGTH_LABEL[level]}
        {level < 2 && password.length > 0 && ' — Mínimo 8 caracteres, mayúsculas y números'}
      </p>
    </div>
  );
};

// ── Campo de contraseña con toggle de visibilidad ─────────────────────────
const PasswordField = ({ id, label, value, onChange, autoComplete, showStrength = false, ...props }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          style={{ paddingRight: '2.8rem' }}
          maxLength={MAX_FIELD_LEN}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={{
            position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none',
            cursor: 'pointer', padding: 4,
            color: 'var(--muted)', fontSize: '0.8rem',
            fontWeight: 'var(--weight-bold)',
            userSelect: 'none',
          }}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
      {showStrength && <StrengthMeter password={value} />}
    </div>
  );
};

// ── Componente principal Login ────────────────────────────────────────────
const Login = () => {
  // 'login' | 'forgot-question' | 'forgot-reset'
  const [mode, setMode] = useState('login');

  // Campos de login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Campos de recuperación
  const [resetUsername,       setResetUsername]       = useState('');
  const [questionKey,         setQuestionKey]         = useState('');
  const [questionText,        setQuestionText]        = useState('');
  const [securityAnswer,      setSecurityAnswer]      = useState('');
  const [newPassword,         setNewPassword]         = useState('');
  const [confirmNewPassword,  setConfirmNewPassword]  = useState('');

  // Estado de la UI
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Rate limiting en cliente
  const attemptsRef  = useRef(0);
  const lockedUntil  = useRef(null);

  const { login } = useAuth();
  const navigate  = useNavigate();

  /** Limpia el formulario y navega entre modos */
  const switchMode = useCallback((newMode) => {
    setError('');
    setSuccess('');
    setMode(newMode);
  }, []);

  /** Verifica si el cliente está bloqueado por intentos fallidos */
  const isLockedOut = () => {
    if (lockedUntil.current && Date.now() < lockedUntil.current) {
      const secsLeft = Math.ceil((lockedUntil.current - Date.now()) / 1000);
      setError(`Demasiados intentos fallidos. Espera ${secsLeft}s antes de volver a intentarlo.`);
      return true;
    }
    return false;
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLockedOut()) return;

    const cleanUser = sanitize(username);
    const cleanPass = password.slice(0, MAX_FIELD_LEN);

    if (!cleanUser) {
      setError('El usuario no puede estar vacío.');
      return;
    }
    if (cleanPass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await login(cleanUser, cleanPass);
      attemptsRef.current = 0;
      navigate('/');
    } catch {
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        lockedUntil.current = Date.now() + LOCKOUT_MS;
        setError(`Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.`);
      } else {
        const remaining = MAX_ATTEMPTS - attemptsRef.current;
        setError(`Usuario o contraseña incorrectos. Te quedan ${remaining} intento${remaining !== 1 ? 's' : ''}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  /** Paso 1: solicitar pregunta aleatoria por nombre de usuario */
  const handleRequestQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanUser = sanitize(resetUsername);
    if (!cleanUser) {
      setError('Ingresa tu nombre de usuario.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/password-reset/question/`, { username: cleanUser });
      setQuestionKey(response.data.question_key);
      setQuestionText(response.data.question_text);
      setMode('forgot-reset');
    } catch (err) {
      setError(err.response?.data?.error || 'No se encontró el usuario o no tiene preguntas de seguridad.');
    } finally {
      setLoading(false);
    }
  };

  /** Paso 2: verificar respuesta y cambiar contraseña */
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!securityAnswer.trim()) {
      setError('Ingresa tu respuesta de seguridad.');
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (passwordStrength(newPassword) < 2) {
      setError('La contraseña es demasiado débil. Usa mayúsculas, números o símbolos.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/password-reset/confirm/`, {
        username:     sanitize(resetUsername),
        question_key: questionKey,
        answer:       securityAnswer.trim(),
        new_password: newPassword,
      });
      setSuccess(response.data.message || 'Contraseña restablecida con éxito.');
      setSecurityAnswer('');
      setNewPassword('');
      setConfirmNewPassword('');
      setMode('login');
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="loading-center" style={{ padding: 'var(--space-4)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: 'var(--space-10)' }}>

        {/* Encabezado */}
        <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--weight-black)',
            background: 'var(--gradient-text)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 'var(--space-2)',
          }}>
            ZenTask
          </h1>
          <p className="text-muted text-sm">
            {mode === 'login'           && 'Inicia sesión para continuar'}
            {mode === 'forgot-question' && 'Recupera tu contraseña'}
            {mode === 'forgot-reset'    && 'Responde tu pregunta de seguridad'}
          </p>
        </div>

        {/* Mensajes */}
        {error && (
          <p
            role="alert"
            className="badge badge-danger"
            style={{ display: 'block', textAlign: 'center', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', whiteSpace: 'pre-wrap' }}
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="badge badge-success"
            style={{ display: 'block', textAlign: 'center', marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}
          >
            {success}
          </p>
        )}

        {/* ── Formulario de Login ── */}
        {mode === 'login' && (
          <form onSubmit={handleSubmit} className="modal-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-username">Usuario</label>
              <input
                id="login-username"
                type="text"
                placeholder="tu_usuario"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                maxLength={MAX_FIELD_LEN}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>Contraseña</label>
                <button
                  type="button"
                  onClick={() => { switchMode('forgot-question'); setResetUsername(''); }}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--color-primary-light)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer', padding: 0,
                    fontWeight: 'var(--weight-bold)',
                  }}
                >
                  ¿La olvidaste?
                </button>
              </div>
              <PasswordField
                id="login-password"
                label={null}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: 'var(--space-4)' }}
              disabled={loading}
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {/* ── Paso 1: Ingresar usuario para obtener pregunta ── */}
        {mode === 'forgot-question' && (
          <form onSubmit={handleRequestQuestion} className="modal-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-username">Nombre de usuario</label>
              <input
                id="forgot-username"
                type="text"
                placeholder="tu_usuario"
                value={resetUsername}
                onChange={e => setResetUsername(e.target.value)}
                autoComplete="username"
                maxLength={MAX_FIELD_LEN}
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: 'var(--space-4)' }}
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Ver mi pregunta de seguridad'}
            </button>
            <button
              type="button"
              className="btn btn-secondary w-full"
              style={{ justifyContent: 'center', padding: 'var(--space-4)', marginTop: 'var(--space-2)' }}
              onClick={() => switchMode('login')}
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {/* ── Paso 2: Responder pregunta + nueva contraseña ── */}
        {mode === 'forgot-reset' && (
          <form onSubmit={handleConfirmReset} className="modal-form" noValidate>
            {/* Pregunta mostrada */}
            <div style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius)',
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.2)',
              marginBottom: 'var(--space-4)',
            }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 'var(--space-1)' }}>
                🔐 Pregunta de seguridad
              </p>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--text)', margin: 0 }}>
                {questionText}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="security-answer">Tu respuesta</label>
              <input
                id="security-answer"
                type="text"
                placeholder="Ingresa tu respuesta"
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
                autoComplete="off"
                maxLength={MAX_FIELD_LEN}
                required
                disabled={loading}
              />
            </div>

            <PasswordField
              id="new-password"
              label="Nueva Contraseña"
              placeholder="••••••••"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={loading}
              showStrength
            />
            <PasswordField
              id="new-password-confirm"
              label="Confirmar Nueva Contraseña"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={loading}
            />

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
              onClick={() => switchMode('forgot-question')}
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
