/**
 * ZenTask — Base de datos local con IndexedDB (Dexie.js)
 *
 * Estructura:
 *  tasks        – Copia local de las tareas del usuario
 *  routines     – Copia local de las rutinas
 *  goals        – Copia local de las metas
 *  progress_logs– Copia local de los registros de progreso
 *  sync_queue   – Cola de operaciones pendientes de sincronización
 *
 * La cola guarda cada operación offline en orden de ocurrencia.
 * Cuando el dispositivo recupera conexión, SyncContext la procesa
 * secuencialmente contra el backend Django / Supabase.
 */

import Dexie from 'dexie';

const db = new Dexie('ZenTaskDB');

db.version(1).stores({
  // Índices separados por coma. El primero es la PK (UUID).
  tasks:         'id, user, is_completed, priority, due_date, updated_at',
  routines:      'id, user, is_active, time',
  goals:         'id, user, status, deadline',
  progress_logs: 'id, content_type, object_id, date',

  // Cola offline: ordenada por timestamp de creación
  sync_queue:    '++_seq, id, method, url, ts',
});

export default db;

// ── Helpers de caché ──────────────────────────────────────────────────────────

/** Reemplaza todos los registros de una tabla con los datos frescos del servidor */
export const refreshTable = async (table, items) => {
  await db[table].clear();
  if (items && items.length > 0) {
    await db[table].bulkPut(items);
  }
};

// ── Helpers de cola offline ───────────────────────────────────────────────────

/** Agrega una operación pendiente a la cola */
export const enqueue = async (method, url, payload) => {
  await db.sync_queue.add({
    id: crypto.randomUUID(),
    method,
    url,
    payload,
    ts: Date.now(),
  });
  window.dispatchEvent(
    new CustomEvent('offline_queue_updated', {
      detail: await db.sync_queue.count(),
    })
  );
};

/** Elimina un item de la cola por su secuencia autoincremental */
export const dequeue = async (seq) => {
  await db.sync_queue.delete(seq);
  window.dispatchEvent(
    new CustomEvent('offline_queue_updated', {
      detail: await db.sync_queue.count(),
    })
  );
};

/** Devuelve todos los items pendientes ordenados cronológicamente */
export const getPendingQueue = () => db.sync_queue.orderBy('ts').toArray();

/** Devuelve el conteo de operaciones pendientes */
export const getPendingCount = () => db.sync_queue.count();
