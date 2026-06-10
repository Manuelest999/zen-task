import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckSquare, Repeat, Target, Layout as DashboardIcon,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/',         label: 'Dashboard', icon: DashboardIcon },
  { path: '/tasks',    label: 'Tareas',    icon: CheckSquare  },
  { path: '/routines', label: 'Rutinas',   icon: Repeat       },
  { path: '/goals',    label: 'Metas',     icon: Target       },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon">
                <Icon size={22} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
