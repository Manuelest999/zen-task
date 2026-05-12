import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modal reutilizable con overlay y animación de escala.
 *
 * Props:
 *   isOpen   {boolean}   — controla visibilidad
 *   onClose  {function}  — callback al cerrar
 *   title    {string}    — título del modal
 *   children {ReactNode} — contenido (formulario, etc.)
 *   maxWidth {string}    — ancho máximo (default '540px')
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = '540px' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{    scale: 0.92, opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="card modal-content"
            style={{ maxWidth }}
          >
            <div className="modal-header">
              <h2 className="modal-title">{title}</h2>
              <button
                onClick={onClose}
                className="btn-icon btn-icon-sm"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
