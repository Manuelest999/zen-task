import React from 'react';
import { PRIORITY_BADGE_CLASS, PRIORITY_LABEL } from '../../utils';

/**
 * Badge — etiqueta de estado/prioridad.
 *
 * Props:
 *   priority {string}  — 'HIGH' | 'MEDIUM' | 'LOW'
 *   label    {string}  — texto alternativo (si no se usa priority)
 *   variant  {string}  — 'primary'|'success'|'warning'|'danger' (override)
 */
const Badge = ({ priority, label, variant }) => {
  if (priority) {
    return (
      <span className={PRIORITY_BADGE_CLASS[priority] || 'badge badge-primary'}>
        {PRIORITY_LABEL[priority] || priority}
      </span>
    );
  }

  return (
    <span className={`badge badge-${variant || 'primary'}`}>
      {label}
    </span>
  );
};

export default Badge;
