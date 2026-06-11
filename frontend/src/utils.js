/**
 * ZenTask — Utilidades compartidas
 * Helpers de fecha/hora, constantes y el wrapper de API offline-first.
 */
import axios from 'axios';
import db, { refreshTable, enqueue } from './lib/db';

// ── URL base de la API ──────────────────────────────────────────────────────
// En desarrollo local: usa '/api' (proxy de Vite → http://localhost:8001/api)
// En producción (Vercel): usa VITE_API_URL → https://tu-backend.railway.app/api
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

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

// ── Mapa de endpoints a tablas de IndexedDB ────────────────────────────────
const ENDPOINT_TABLE_MAP = {
  '/tasks/':      'tasks',
  '/routines/':   'routines',
  '/goals/':      'goals',
  '/progress/':   'progress_logs',
};

/**
 * Detecta qué tabla de IndexedDB corresponde a un endpoint.
 * Ej: '/tasks/3e4a.../' → 'tasks'
 */
const getTableForEndpoint = (endpoint) => {
  for (const [prefix, table] of Object.entries(ENDPOINT_TABLE_MAP)) {
    if (endpoint.startsWith(prefix) || endpoint === prefix.slice(0, -1)) {
      return table;
    }
  }
  return null;
};

// ── Wrapper API (Offline-First) ────────────────────────────────────────────
/**
 * Realiza una llamada a la API con soporte offline completo:
 *
 * GET:
 *   - Si hay conexión: llama al backend, actualiza caché local y retorna la respuesta.
 *   - Si no hay conexión: retorna los datos de IndexedDB.
 *
 * POST / PATCH / DELETE (mutaciones):
 *   - Si hay conexión: ejecuta la petición normalmente.
 *   - Si no hay conexión:
 *       1. Genera un UUID local si es POST.
 *       2. Aplica el cambio optimistamente en IndexedDB.
 *       3. Encola la operación en sync_queue para sincronizar después.
 *       4. Retorna un objeto simulado de éxito.
 */
export const apiCall = async (method, endpoint, data = null) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const upperMethod = method.toUpperCase();
  const table = getTableForEndpoint(endpoint);

  // ── GET ──────────────────────────────────────────────────────────────────
  if (upperMethod === 'GET') {
    if (navigator.onLine) {
      try {
        const response = await axios({ method: 'GET', url });
        // Actualizar caché local si conocemos la tabla
        if (table) {
          const items = Array.isArray(response.data)
            ? response.data
            : response.data?.results ?? [];
          await refreshTable(table, items);
        }
        return response;
      } catch (err) {
        // Falló la red aunque navigator.onLine era true → fallback a caché
        console.warn(`[apiCall] GET fallo red, usando caché para ${table}`, err);
      }
    }

    // Modo offline o fallo de red → servir desde IndexedDB
    if (table) {
      const cachedItems = await db[table].toArray();
      return { data: cachedItems, offline: true };
    }
    throw new Error(`Sin conexión y sin caché disponible para ${endpoint}`);
  }

  // ── POST / PATCH / DELETE ────────────────────────────────────────────────
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(upperMethod)) {
    if (navigator.onLine) {
      // Online: petición directa al servidor
      return axios({ method: upperMethod, url, data });
    }

    // Offline: actuación optimista + cola
    if (!table) {
      // Endpoints sin tabla local (ej: /dashboard/summary/) se encolan igualmente
      await enqueue(upperMethod, endpoint, data);
      return { data: { offline: true }, offline: true };
    }

    const localData = { ...data };

    if (upperMethod === 'POST') {
      // Asignar UUID local si no viene uno ya asignado
      if (!localData.id) {
        localData.id = crypto.randomUUID();
      }
      // Guardar en IndexedDB de inmediato (optimista)
      await db[table].put({ ...localData, _offline: true });
    } else if (upperMethod === 'PATCH' || upperMethod === 'PUT') {
      // Extraer el ID del endpoint (/tasks/uuid/) y actualizar localmente
      const segments = endpoint.split('/').filter(Boolean);
      const resourceId = segments[segments.length - 1];
      const existing = await db[table].get(resourceId);
      if (existing) {
        await db[table].put({ ...existing, ...localData, _offline: true });
      }
    } else if (upperMethod === 'DELETE') {
      const segments = endpoint.split('/').filter(Boolean);
      const resourceId = segments[segments.length - 1];
      await db[table].delete(resourceId);
    }

    // Encolar para sincronización posterior
    await enqueue(upperMethod, endpoint, localData);

    return { data: { ...localData, offline: true }, offline: true };
  }

  // Fallback para métodos no contemplados
  return axios({ method: upperMethod, url, data });
};
