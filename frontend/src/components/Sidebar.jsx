import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckSquare, Repeat, Target, Layout as DashboardIcon,
  Moon, Sun, LogOut
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/',         label: 'Dashboard', icon: DashboardIcon },
  { path: '/tasks',    label: 'Tareas',    icon: CheckSquare  },
  { path: '/routines', label: 'Rutinas',   icon: Repeat       },
  { path: '/goals',    label: 'Metas',     icon: Target       },
];

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Nav items horizontales */}
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

      {/* Acciones de sistema (Modo claro/oscuro + logout) */}
      <div className="sidebar-footer">
        <button
          onClick={toggleTheme}
          className="sidebar-action"
          title={theme === 'light' ? 'Modo noche' : 'Modo día'}
        >
          {theme === 'light'
            ? <Moon size={22} color="var(--color-primary-light)" />
            : <Sun  size={22} color="var(--color-warning-light)" />
          }
        </button>

        <button
          onClick={logout}
          className="sidebar-action sidebar-action-danger"
          title="Cerrar sesión"
        >
          <LogOut size={22} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
