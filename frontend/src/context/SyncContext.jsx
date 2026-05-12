import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { getOfflineQueue, clearQueue, removeFromQueue } from '../lib/offlineQueue';
import { API_BASE } from '../utils';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef(null);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Sync offline queue to server
  const processOfflineQueue = useCallback(async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0 || !navigator.onLine) return;

    setIsSyncing(true);
    for (const item of queue) {
      try {
        await axios({
          method: item.method,
          url: `${API_BASE.replace('/api', '')}${item.url}`, // API_BASE is http://localhost:8001/api, item.url might be /api/tasks/
          data: item.data
        });
        removeFromQueue(item.id);
      } catch (err) {
        console.error("Error processing offline item", err);
      }
    }
    setIsSyncing(false);
    // Notify app to fetch fresh data
    window.dispatchEvent(new CustomEvent('sync_update', { detail: { type: 'queue_processed' } }));
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log('ZenSync: Browser is ONLINE');
      setIsOnline(true);
      processOfflineQueue();
    };
    const handleOffline = () => {
      console.log('ZenSync: Browser is OFFLINE');
      setIsOnline(false);
    };
    const handleQueueUpdate = (e) => {
      console.log('ZenSync: Offline queue count:', e.detail);
      setPendingCount(e.detail);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline_queue_updated', handleQueueUpdate);
    
    // Initial check
    setPendingCount(getOfflineQueue().length);
    if (navigator.onLine) processOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline_queue_updated', handleQueueUpdate);
    };
  }, [processOfflineQueue]);

  // WebSocket with exponential backoff
  useEffect(() => {
    let reconnectTimer = null;
    let reconnectDelay = 1000;

    const connect = () => {
      if (!token || !isOnline) return;

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/sync/?token=${token}`;
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
          console.log("WebSocket connected");
          reconnectDelay = 1000; // reset backoff
        };

        socketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            window.dispatchEvent(new CustomEvent('sync_update', { detail: data }));
          } catch (e) {
            console.error("Error parsing WebSocket message", e);
          }
        };

        socketRef.current.onerror = (error) => {
          console.warn("WebSocket error:", error);
        };

        socketRef.current.onclose = () => {
          console.log("WebSocket connection closed");
          if (isOnline) {
            reconnectTimer = setTimeout(() => {
              reconnectDelay = Math.min(reconnectDelay * 2, 30000);
              connect();
            }, reconnectDelay);
          }
        };
      } catch (err) {
        console.error("Failed to establish WebSocket connection", err);
      }
    };

    connect();

    return () => {
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
