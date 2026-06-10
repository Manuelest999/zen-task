import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, LogOut, X, ChevronRight, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

/**
 * UserMenu — renderiza el panel con createPortal para escapar
 * del stacking context creado por backdrop-filter en el top bar.
 */
const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const panelRef = useRef(null);

  // Colores 100% sólidos según el tema
  const panelBg      = theme === 'light' ? '#ffffff'  : '#0d1117';
  const dividerColor = theme === 'light' ? '#e2d9fe'  : '#1e2a45';
  const labelColor   = theme === 'light' ? '#7c3aed'  : '#475569';
  const textColor    = theme === 'light' ? '#1e1b4b'  : '#f0f4ff';
  const mutedColor   = theme === 'light' ? '#7c3aed'  : '#94a3b8';

  // Cerrar al hacer clic fuera del panel
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Contenido del portal (overlay + panel) — renderizado en document.body
  const portalContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.50)',
              zIndex: 9998,
            }}
          />

          {/* Panel lateral */}
          <motion.div
            ref={panelRef}
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '280px',
              backgroundColor: panelBg,
              borderLeft: `1px solid ${dividerColor}`,
              boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              gap: '16px',
              overflowY: 'auto',
            }}
          >
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <img src="/pwa-192x192.png" alt="ZenTask" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: textColor }}>Mi Cuenta</p>
                  <p style={{ color: mutedColor, fontSize: '0.75rem', margin: 0 }}>ZenTask</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="btn-icon btn-icon-sm" aria-label="Cerrar panel">
                <X size={16} />
              </button>
            </div>

            <div style={{ height: '1px', backgroundColor: dividerColor }} />

            {/* Apariencia */}
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Apariencia
              </p>
              <button onClick={() => toggleTheme()} className="user-menu-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {theme === 'light' ? <Moon size={18} color="#a78bfa" /> : <Sun size={18} color="#fdba74" />}
                  <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                </div>
                <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ height: '1px', backgroundColor: dividerColor }} />

            {/* Cuenta */}
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Cuenta
              </p>
              <button onClick={() => { setOpen(false); logout(); }} className="user-menu-item user-menu-item-danger">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <LogOut size={18} />
                  <span>Cerrar Sesión</span>
                </div>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 'auto' }}>
              <p style={{ fontSize: '0.7rem', color: labelColor, textAlign: 'center', fontWeight: 500 }}>
                ZenTask · Tu espacio de enfoque
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Botón disparador */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="user-menu-trigger"
        title="Menú"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Portal: renderiza en document.body, fuera del stacking context del top bar */}
      {createPortal(portalContent, document.body)}
    </>
  );
};

export default UserMenu;
