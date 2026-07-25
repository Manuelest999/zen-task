import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// ── Constantes de seguridad ────────────────────────────────────────────────
const MAX_FIELD_LEN  = 150;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/; // solo alfanumérico y guión bajo, 3-30 chars

/** Elimina caracteres potencialmente peligrosos para XSS/injection */
const sanitize = (str) =>
  String(str).replace(/[<>"'`;&\\]/g, '').trim().slice(0, MAX_FIELD_LEN);

/** Valida formato de email */
const isValidEmail = (email) =>
  /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/.test(email);

/** Evalúa la fortaleza de la contraseña (0-4) */
const passwordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8)             score++;
  if (pwd.length >= 12)            score++;
  if (/[A-Z]/.test(pwd))          score++;
  if (/[0-9]/.test(pwd))          score++;
  if (/[^A-Za-z0-9]/.test(pwd))   score++;
  return Math.min(score, 4);
};

const STRENGTH_LABEL = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
const STRENGTH_COLOR = [
  '',
  'var(--color-danger)',
  'var(--color-warning)',
  'var(--color-primary-light)',
  'var(--color-success)',
];

// ── Preguntas de seguridad disponibles ────────────────────────────────────
const SECURITY_QUESTIONS = [
  { key: 'pet',     text: '¿Cuál es el nombre de tu mascota?' },
  { key: 'movie',   text: '¿Cuál es tu película favorita?' },
  { key: 'country', text: '¿Qué país te gustaría visitar?' },
  { key: 'friend',  text: '¿Cuál es el nombre de tu mejor amigo de la infancia?' },
  { key: 'school',  text: '¿Cuál es el nombre de tu escuela primaria?' },
  { key: 'food',    text: '¿Cuál es tu comida favorita?' },
];

// ── Indicador de fortaleza ─────────────────────────────────────────────────
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
        {level < 2 && ' — Usa mayúsculas, números o símbolos'}
      </p>
    </div>
  );
};

// ── Campo de contraseña con toggle de visibilidad ─────────────────────────
const PasswordField = ({ id, label, value, onChange, autoComplete, showStrength = false, ...props }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
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

// ── Subcomponente: Fila de pregunta de seguridad ────────────────────────────
const SecurityQuestionRow = ({ index, questionKey, answer, usedKeys, onChange, disabled }) => {
  const available = SECURITY_QUESTIONS.filter(
    q => q.key === questionKey || !usedKeys.includes(q.key)
  );

  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label
        className="form-label"
        htmlFor={`sq-${index}`}
        style={{ marginBottom: 'var(--space-1)', display: 'block' }}
      >
        Pregunta {index + 1}
      </label>
      <select
        id={`sq-${index}`}
        value={questionKey}
        onChange={e => onChange(index, 'key', e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          marginBottom: 'var(--space-2)',
          padding: 'var(--space-3)',
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          fontSize: 'var(--text-sm)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <option value="">— Selecciona una pregunta —</option>
        {available.map(q => (
          <option key={q.key} value={q.key}>{q.text}</option>
        ))}
      </select>
      <input
        id={`sa-${index}`}
        type="text"
        placeholder="Tu respuesta"
        value={answer}
        onChange={e => onChange(index, 'answer', e.target.value)}
        disabled={disabled || !questionKey}
        maxLength={MAX_FIELD_LEN}
        autoComplete="off"
      />
    </div>
  );
};

// ── Componente Register ────────────────────────────────────────────────────
const Register = () => {
  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);

  // 3 preguntas de seguridad
  const [securityRows, setSecurityRows] = useState([
    { key: '', answer: '' },
    { key: '', answer: '' },
    { key: '', answer: '' },
  ]);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleSecurityChange = (index, field, value) => {
    setSecurityRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Las claves ya usadas en otras filas (para deshabilitar opciones duplicadas)
  const usedKeysByRow = (currentIndex) =>
    securityRows
      .filter((_, i) => i !== currentIndex)
      .map(r => r.key)
      .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ── Validaciones en cliente ────────────────────────────────────────
    const cleanUser  = sanitize(username);
    const cleanEmail = sanitize(email).toLowerCase();
    const cleanPass  = password.slice(0, MAX_FIELD_LEN);
    const cleanConf  = confirmPassword.slice(0, MAX_FIELD_LEN);

    if (!cleanUser || !cleanEmail || !cleanPass || !cleanConf) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (!USERNAME_REGEX.test(cleanUser)) {
      setError('El usuario debe tener entre 3 y 30 caracteres. Solo letras, números y guión bajo (_).');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    if (cleanPass.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (passwordStrength(cleanPass) < 2) {
      setError('La contraseña es demasiado débil. Agrega mayúsculas, números o símbolos.');
      return;
    }

    if (cleanPass !== cleanConf) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // Validar preguntas de seguridad
    for (let i = 0; i < 3; i++) {
      if (!securityRows[i].key) {
        setError(`Selecciona la pregunta de seguridad ${i + 1}.`);
        return;
      }
      if (!securityRows[i].answer.trim()) {
        setError(`Ingresa la respuesta a la pregunta de seguridad ${i + 1}.`);
        return;
      }
    }

    const keys = securityRows.map(r => r.key);
    if (new Set(keys).size !== 3) {
      setError('Las 3 preguntas de seguridad deben ser diferentes.');
      return;
    }

    // ── Envío al backend ───────────────────────────────────────────────
    setLoading(true);
    try {
      const securityAnswers = {
        question_1: securityRows[0].key,
        answer_1:   securityRows[0].answer.trim(),
        question_2: securityRows[1].key,
        answer_2:   securityRows[1].answer.trim(),
        question_3: securityRows[2].key,
        answer_3:   securityRows[2].answer.trim(),
      };
      await register(cleanUser, cleanEmail, cleanPass, securityAnswers);
      navigate('/');
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        const firstKey  = Object.keys(data)[0];
        const errorMsg  = data[firstKey];
        setError(Array.isArray(errorMsg) ? errorMsg[0] : String(errorMsg));
      } else {
        setError('Ocurrió un error al registrar el usuario. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loading-center" style={{ padding: 'var(--space-4)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: 'var(--space-10)' }}>

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
            Crear Cuenta
          </h1>
          <p className="text-muted text-sm">Regístrate para empezar a usar ZenTask</p>
        </div>

        {error && (
          <p
            role="alert"
            className="badge badge-danger"
            style={{ display: 'block', textAlign: 'center', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', whiteSpace: 'pre-wrap' }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="modal-form" noValidate>

          {/* Usuario */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-username">Usuario</label>
            <input
              id="register-username"
              type="text"
              placeholder="tu_usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              maxLength={30}
              required
              disabled={loading}
            />
            {username && !USERNAME_REGEX.test(sanitize(username)) && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', margin: 'var(--space-1) 0 0', fontWeight: 'var(--weight-bold)' }}>
                Solo letras, números y _ · entre 3 y 30 caracteres
              </p>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Correo Electrónico</label>
            <input
              id="register-email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={MAX_FIELD_LEN}
              required
              disabled={loading}
            />
            {email && !isValidEmail(email) && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', margin: 'var(--space-1) 0 0', fontWeight: 'var(--weight-bold)' }}>
                Formato de correo inválido
              </p>
            )}
          </div>

          {/* Contraseña */}
          <PasswordField
            id="register-password"
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={loading}
            showStrength
          />

          {/* Confirmar contraseña */}
          <PasswordField
            id="register-confirm-password"
            label="Confirmar Contraseña"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={loading}
          />
          {confirmPassword && password !== confirmPassword && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', margin: '-var(--space-2) 0 var(--space-2)', fontWeight: 'var(--weight-bold)' }}>
              Las contraseñas no coinciden
            </p>
          )}

          {/* Preguntas de Seguridad */}
          <div style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-5)',
            borderRadius: 'var(--radius)',
            background: 'rgba(124,58,237,0.07)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}>
            <p style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-primary-light)',
              marginBottom: 'var(--space-1)',
            }}>
              🔐 Preguntas de Seguridad
            </p>
            <p className="text-muted text-xs" style={{ marginBottom: 'var(--space-4)' }}>
              Estas preguntas te permitirán recuperar tu contraseña si la olvidas.
              Elige 3 diferentes y recuerda tus respuestas.
            </p>
            {securityRows.map((row, i) => (
              <SecurityQuestionRow
                key={i}
                index={i}
                questionKey={row.key}
                answer={row.answer}
                usedKeys={usedKeysByRow(i)}
                onChange={handleSecurityChange}
                disabled={loading}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', padding: 'var(--space-4)', marginTop: 'var(--space-6)' }}
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
