import React from 'react';
import Sidebar from './Sidebar';
import NetworkStatus from './NetworkStatus';
import UserMenu from './ui/UserMenu';

const Layout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />

    {/* Top bar con botón de usuario */}
    <header className="top-bar">
      <div className="top-bar-logo">
        <img
          src="/pwa-192x192.png"
          alt="ZenTask"
          style={{ width: 32, height: 32, borderRadius: 8, display: 'block' }}
        />
        <span>ZenTask</span>
      </div>
      <UserMenu />
    </header>

    <main className="page-main">
      <NetworkStatus />
      {children}
    </main>
  </div>
);

export default Layout;
