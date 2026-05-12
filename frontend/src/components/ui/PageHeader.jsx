import React from 'react';

/**
 * PageHeader — título de página + botón de acción primaria.
 *
 * Props:
 *   title    {string}    — h1 de la página
 *   action   {ReactNode} — botón u otro elemento de acción (opcional)
 */
const PageHeader = ({ title, action }) => (
  <header className="page-header">
    <h1 className="page-title">{title}</h1>
    {action && <div>{action}</div>}
  </header>
);

export default PageHeader;
