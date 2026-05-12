import React from 'react';
import { Wifi, WifiOff, RefreshCw, UploadCloud } from 'lucide-react';
import { useSync } from '../context/SyncContext';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkStatus = () => {
  const { isOnline, isSyncing, pendingCount } = useSync();
  const [showOnline, setShowOnline] = React.useState(false);

  // Mostrar "Conectado" brevemente al volver a estar online
  React.useEffect(() => {
    if (isOnline) {
      setShowOnline(true);
      const timer = setTimeout(() => setShowOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const visible = !isOnline || isSyncing || pendingCount > 0 || showOnline;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          style={{
            position: 'fixed',
            top: 'var(--space-4)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-6)',
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface-1)',
            backdropFilter: 'var(--glass-strong)',
            WebkitBackdropFilter: 'var(--glass-strong)',
            border: '1px solid var(--surface-border)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-bold)',
          }}
        >
          {!isOnline ? (
            <>
              <WifiOff size={18} color="var(--color-danger)" />
              <span style={{ color: 'var(--color-danger)' }}>Sin conexión</span>
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw size={18} color="var(--color-primary)" className="spin" />
              <span style={{ color: 'var(--color-primary)' }}>Sincronizando...</span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <UploadCloud size={18} color="var(--color-warning)" />
              <span style={{ color: 'var(--color-warning)' }}>{pendingCount} pendientes</span>
            </>
          ) : showOnline ? (
            <>
              <Wifi size={18} color="var(--color-success)" />
              <span style={{ color: 'var(--color-success)' }}>Conectado</span>
            </>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatus;
