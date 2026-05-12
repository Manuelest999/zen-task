import React from 'react';

/**
 * SectionHeader — título de sección con icono + botón de acción.
 *
 * Props:
 *   title    {string}    — texto del h2
 *   icon     {ReactNode} — icono Lucide (ya instanciado)
 *   action   {ReactNode} — botón u otro elemento (opcional)
 */
const SectionHeader = ({ title, icon, action }) => (
  <div className="section-header">
    <h2 className="section-title">
      {icon}
      {title}
    </h2>
    {action && <div>{action}</div>}
  </div>
);

export default SectionHeader;
