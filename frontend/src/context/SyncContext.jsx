/**
 * ZenTask — SyncContext
 * Maneja el estado de conectividad, la sincronización de la cola offline
 * (almacenada en IndexedDB via Dexie) y la conexión WebSocket con el backend.
 */
import React, {
  createContext, useContext, useEffect, useRef, useState, useCallback,
} from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_BASE } from '../utils';
import db, { getPendingQueue, getPendingCount, dequeue } from '../lib/db';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef(null);

  const [isOnline, setIsOnline]       = useState(navigator.onLine);
  const [isSyncing, setIsSyncing]     = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // ── Procesar cola offline ────────────────────────────────────────────────
  const processOfflineQueue = useCallback(async () => {
    const queue = await getPendingQueue();
    if (queue.length === 0 || !navigator.onLine) return;

    setIsSyncing(true);

    for (const item of queue) {
      try {
        const url = item.url.startsWith('http')
          ? item.url
          : `${API_BASE}${item.url}`;

        await axios({
          method:  item.method,
          url,
          data:    item.payload ?? null,
        });

        // Eliminar de la cola si el servidor respondió con éxito
        await dequeue(item._seq);
      } catch (err) {
        const status = err?.response?.status;
        if (status >= 400 && status < 500) {
          // Error de validación o recurso no encontrado → descartar para no bloquear
          console.warn('[SyncContext] Error del cliente, descartando item:', item, err.message);
          await dequeue(item._seq);
        } else {
          // Error de servidor o red → dejar en cola para reintentar después
          console.error('[SyncContext] Error de servidor, reintentando más tarde:', item, err.message);
          break; // Detener procesamiento para no consumir innecesariamente
        }
      }
    }

    setIsSyncing(false);
    // Actualizar contador de pendientes
    const remaining = await getPendingCount();
    setPendingCount(remaining);

    // Notificar a las páginas que recarguen sus datos desde el servidor
    if (remaining === 0) {
      window.dispatchEvent(
        new CustomEvent('sync_update', { detail: { type: 'queue_processed' } })
      );
    }
  }, []);

  // ── Escuchar eventos de conectividad ─────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      console.log('[ZenSync] Conexión recuperada → procesando cola');
      setIsOnline(true);
      processOfflineQueue();
    };

    const handleOffline = () => {
      console.log('[ZenSync] Sin conexión → modo offline activado');
      setIsOnline(false);
    };

    const handleQueueUpdate = (e) => {
      setPendingCount(e.detail ?? 0);
    };

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline_queue_updated', handleQueueUpdate);

    // Carga inicial del contador y procesamiento si hay conexión
    getPendingCount().then(setPendingCount);
    if (navigator.onLine) processOfflineQueue();

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline_queue_updated', handleQueueUpdate);
    };
  }, [processOfflineQueue]);

  // ── WebSocket con backoff exponencial ────────────────────────────────────
  useEffect(() => {
    let reconnectTimer  = null;
    let reconnectDelay  = 1000;
    let isMounted       = true;

    const connect = () => {
      if (!token || !isOnline || !isMounted) return;

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/sync/?token=${token}`;
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
          console.log('[ZenSync] WebSocket conectado');
          reconnectDelay = 1000; // resetear backoff
        };

        socketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            window.dispatchEvent(new CustomEvent('sync_update', { detail: data }));
          } catch (e) {
            console.error('[ZenSync] Error parseando mensaje WS:', e);
          }
        };

        socketRef.current.onerror = (error) => {
          console.warn('[ZenSync] Error de WebSocket:', error);
        };

        socketRef.current.onclose = () => {
          console.log('[ZenSync] WebSocket cerrado');
          if (isOnline && isMounted) {
            reconnectTimer = setTimeout(() => {
              reconnectDelay = Math.min(reconnectDelay * 2, 30000);
              connect();
            }, reconnectDelay);
          }
        };
      } catch (err) {
        console.error('[ZenSync] No se pudo establecer la conexión WS:', err);
      }
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      if (socketRef.current) socketRef.current.close();
    };
  }, [token, isOnline]);

  return (
    <SyncContext.Provider value={{ isOnline, isSyncing, pendingCount }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => useContext(SyncContext);
