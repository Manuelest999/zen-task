import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu, CheckSquare, Repeat, Target, Layout as DashboardIcon,
  Moon, Sun, LogOut, ChevronLeft,
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
  const [isOpen, setIsOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();

  const width = isOpen ? 'var(--sidebar-width)' : 'var(--sidebar-width-collapsed)';
  const justify = isOpen ? 'flex-start' : 'center';

  return (
    <aside className="sidebar" style={{ width }}>

      {/* Logo + toggle */}
      <div className="sidebar-logo">
        {isOpen && <h2 className="sidebar-logo-text">ZenTask</h2>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn-icon btn-icon-sm"
          aria-label="Toggle sidebar"
        >
          {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ justifyContent: justify }}
              title={!isOpen ? label : undefined}
            >
              <span className="nav-item-icon">
                <Icon size={20} />
              </span>
              {isOpen && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="sidebar-footer">
        <button
          onClick={toggleTheme}
          className="sidebar-action"
          style={{ justifyContent: justify }}
          title={!isOpen ? (theme === 'light' ? 'Modo noche' : 'Modo día') : undefined}
        >
          <span className="nav-item-icon">
            {theme === 'light'
              ? <Moon size={20} color="var(--color-primary-light)" />
              : <Sun  size={20} color="var(--color-warning-light)" />
            }
          </span>
          {isOpen && <span>Modo {theme === 'light' ? 'Noche' : 'Día'}</span>}
        </button>

        <button
          onClick={logout}
          className="sidebar-action sidebar-action-danger"
          style={{ justifyContent: justify }}
          title={!isOpen ? 'Cerrar sesión' : undefined}
        >
          <span className="nav-item-icon">
            <LogOut size={20} />
          </span>
          {isOpen && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
