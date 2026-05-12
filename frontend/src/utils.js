/**
 * ZenTask — Utilidades compartidas
 * Helpers de fecha/hora y constantes usadas en múltiples componentes.
 */
import axios from 'axios';
import { addToQueue } from './lib/offlineQueue';

// ── URL base de la API ──────────────────────────────────────────────────────
export const API_BASE = '/api';

// ── Días de la semana ───────────────────────────────────────────────────────
export const DAYS = [
  { id: 'mon', label: 'L', full: 'Lunes'     },
  { id: 'tue', label: 'M', full: 'Martes'    },
  { id: 'wed', label: 'X', full: 'Miércoles' },
  { id: 'thu', label: 'J', full: 'Jueves'    },
  { id: 'fri', label: 'V', full: 'Viernes'   },
  { id: 'sat', label: 'S', full: 'Sábado'    },
  { id: 'sun', label: 'D', full: 'Domingo'   },
];

// ── Formateo de hora en 12h ─────────────────────────────────────────────────
/**
 * Convierte un datetime ISO o string HH:MM a formato 12h (ej: "3:45 PM").
 * Nunca usa Date() para evitar problemas de zona horaria.
 */
export const formatTime12h = (dateStr) => {
  if (!dateStr) return '';
  const timePart = dateStr.includes('T')
    ? dateStr.split('T')[1].split('.')[0]
    : dateStr;
  const [hours, minutes] = timePart.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
};

// ── Formateo de fecha ───────────────────────────────────────────────────────
/**
 * Convierte un datetime ISO o string YYYY-MM-DD a formato DD/MM/YYYY.
 * Nunca usa Date() para evitar problemas de zona horaria.
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
};

// ── Fecha de hoy (ISO, sin zona horaria) ──────────────────────────────────
export const todayISO = () => new Date().toISOString().split('T')[0];

// ── Colores semánticos por prioridad ─────────────────────────────────────────
export const PRIORITY_COLOR = {
  HIGH:   'var(--color-danger)',
  MEDIUM: 'var(--color-primary)',
  LOW:    'var(--color-success)',
};

export const PRIORITY_LABEL = {
  HIGH:   'Alta',
  MEDIUM: 'Media',
  LOW:    'Baja',
};

export const PRIORITY_BADGE_CLASS = {
  HIGH:   'badge badge-danger',
  MEDIUM: 'badge badge-primary',
  LOW:    'badge badge-success',
};

// ── Wrapper API ─────────────────────────────────────────────────────────────
/**
 * Realiza una llamada a la API. Si no hay conexión y la operación es mutativa
 * (POST, PATCH, DELETE), la guarda en la cola offline y la resuelve simulando éxito.
 */
export const apiCall = async (method, endpoint, data = null) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  if (!navigator.onLine && ['POST', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const route = endpoint.replace(API_BASE, '');
    addToQueue(method, route, data);
    return { data: { offline: true, id: Date.now() } };
  }

  return axios({ method, url, data });
};
